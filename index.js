const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const { Buffer } = require("buffer");

const app = express();
const port = process.env.PORT || 3000;

// Hapa ndipo tunatengeneza muonekano wa Web (HTML/CSS)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DarkX Session Generator</title>
        <style>
            body { background: #0f0f0f; color: #00ff00; font-family: 'Courier New', monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { border: 2px solid #00ff00; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px #00ff00; text-align: center; width: 350px; }
            input { background: transparent; border: 1px solid #00ff00; color: #00ff00; padding: 10px; width: 80%; margin-bottom: 20px; outline: none; border-radius: 5px; }
            button { background: #00ff00; color: #000; border: none; padding: 10px 20px; cursor: pointer; font-weight: bold; border-radius: 5px; transition: 0.3s; }
            button:hover { background: #008800; color: #fff; }
            #pairingCode { font-size: 24px; font-weight: bold; margin-top: 20px; color: #fff; letter-spacing: 5px; }
            .loader { color: #fff; font-size: 14px; margin-top: 10px; display: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>DARKX SESSION</h2>
            <p>Ingiza namba ya simu (255xxx):</p>
            <input type="text" id="phone" placeholder="Mfano: 255775710774">
            <button onclick="getCode()">GENERATE CODE</button>
            <div id="loader" class="loader">Tafadhali subiri...</div>
            <div id="pairingCode"></div>
        </div>

        <script>
            async function getCode() {
                const phone = document.getElementById('phone').value;
                const loader = document.getElementById('loader');
                const codeDiv = document.getElementById('pairingCode');
                
                if (!phone) return alert("Weka namba!");
                
                loader.style.display = "block";
                codeDiv.innerText = "";

                try {
                    const response = await fetch('/pair?phone=' + phone);
                    const data = await response.json();
                    loader.style.display = "none";
                    
                    if (data.pairingCode) {
                        codeDiv.innerText = data.pairingCode;
                    } else {
                        alert("Imeshindwa! Jaribu tena.");
                    }
                } catch (e) {
                    loader.style.display = "none";
                    alert("Hitilafu ya Server.");
                }
            }
        </script>
    </body>
    </html>
    `);
});

async function generateSession(phoneNumber) {
    const { state, saveCreds } = await useMultiFileAuthState('./temp_session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        await delay(1500);
        const code = await sock.requestPairingCode(phoneNumber);
        
        // Hapa bot itasubiri link itokee kisha itume Session ID
        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', async (update) => {
            const { connection } = update;
            if (connection === 'open') {
                await delay(5000);
                const creds = fs.readFileSync('./temp_session/creds.json');
                const sessionID = "DarkX-Ultra~" + Buffer.from(creds).toString('base64');
                await sock.sendMessage(sock.user.id, { text: sessionID });
                process.exit(0);
            }
        });

        return { code };
    }
}

app.get('/pair', async (req, res) => {
    let phone = req.query.phone;
    if (!phone) return res.json({ error: "No phone number" });
    try {
        const result = await generateSession(phone);
        res.json({ pairingCode: result.code });
    } catch (e) {
        res.json({ error: "Internal Error" });
    }
});

app.listen(port, () => console.log(`Site ipo hewani port ${port}`));
