const express = require('express');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const { Buffer } = require("buffer");

const app = express();
const port = process.env.PORT || 3000;

// Website UI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DarkX Session Generator</title>
        <style>
            body { background: #080808; color: #00ff41; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { border: 1px solid #00ff41; padding: 40px; border-radius: 15px; box-shadow: 0 0 30px rgba(0, 255, 65, 0.2); text-align: center; width: 380px; background: rgba(0,0,0,0.8); }
            h2 { letter-spacing: 3px; margin-bottom: 10px; }
            input { background: #111; border: 1px solid #00ff41; color: #fff; padding: 12px; width: 85%; margin-bottom: 25px; outline: none; border-radius: 8px; text-align: center; font-size: 16px; }
            button { background: #00ff41; color: #000; border: none; padding: 12px 25px; cursor: pointer; font-weight: bold; border-radius: 8px; width: 93%; font-size: 16px; transition: 0.4s; }
            button:hover { background: #008f11; color: #fff; transform: scale(1.02); }
            #pairingCode { font-size: 28px; font-weight: bold; margin-top: 25px; color: #fff; letter-spacing: 8px; border: 1px dashed #00ff41; padding: 10px; border-radius: 5px; display: none; }
            .loader { color: #aaa; font-size: 14px; margin-top: 15px; display: none; }
            .footer { margin-top: 20px; font-size: 12px; color: #555; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>DARKX-SESSION</h2>
            <p style="color: #888;">Ingiza namba yako kuanza (255...)</p>
            <input type="text" id="phone" placeholder="255775710774">
            <button onclick="getCode()">GENERATE PAIRING CODE</button>
            <div id="loader" class="loader">Inatengeneza kodi, tafadhali subiri...</div>
            <div id="pairingCode"></div>
            <div class="footer">© 2026 MrX Developer - DarkX Project</div>
        </div>

        <script>
            async function getCode() {
                const phone = document.getElementById('phone').value;
                const loader = document.getElementById('loader');
                const codeDiv = document.getElementById('pairingCode');
                
                if (!phone || phone.length < 10) return alert("Weka namba sahihi!");
                
                loader.style.display = "block";
                codeDiv.style.display = "none";

                try {
                    const response = await fetch('/pair?phone=' + phone);
                    const data = await response.json();
                    loader.style.display = "none";
                    
                    if (data.pairingCode) {
                        codeDiv.innerText = data.pairingCode;
                        codeDiv.style.display = "block";
                    } else {
                        alert("Hitilafu: " + (data.error || "Jaribu tena."));
                    }
                } catch (e) {
                    loader.style.display = "none";
                    alert("Server error! Hakikisha Render ipo Live.");
                }
            }
        </script>
    </body>
    </html>
    `);
});

// Baileys Logic
async function generateSession(phoneNumber) {
    // Kila mchakato mpya unaanza na folder safi la session
    if (fs.existsSync('./temp_session')) {
        fs.rmSync('./temp_session', { recursive: true, force: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState('./temp_session');
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        // VERSION FIXED: Inatambulika kama Chrome ya kisasa kabisa
        browser: ["Ubuntu", "Chrome", "121.0.6167.160"],
        syncFullHistory: false
    });

    if (!sock.authState.creds.registered) {
        await delay(2000);
        const code = await sock.requestPairingCode(phoneNumber);

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                await delay(5000);
                const creds = fs.readFileSync('./temp_session/creds.json');
                const sessionID = "DarkX-Ultra~" + Buffer.from(creds).toString('base64');
                
                // Tuma Session ID kwa User
                await sock.sendMessage(sock.user.id, { 
                    text: `*SESSION ID YAKO IPO TAYARI! (DARKX-ULTRA)*\n\n\`\`\`${sessionID}\`\`\`\n\n> © MrX Developer` 
                });

                console.log("Session ID sent!");
                await delay(2000);
                process.exit(0);
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (!shouldReconnect) process.exit(0);
            }
        });

        return { code };
    }
}

app.get('/pair', async (req, res) => {
    let phone = req.query.phone;
    if (!phone) return res.json({ error: "Weka namba ya simu!" });
    
    try {
        const result = await generateSession(phone.replace(/[^0-9]/g, ''));
        res.json({ pairingCode: result.code });
    } catch (e) {
        console.error(e);
        res.json({ error: "Imeshindwa kutengeneza kodi. Refresh page." });
    }
});

app.listen(port, () => console.log(`Site ipo hewani port ${port}`));
