const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const { Buffer } = require("buffer");

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("DarkX Session Generator is Online! Use /pair?phone=255xxx to get code.");
});

async function generateSession(phoneNumber) {
    const { state, saveCreds } = await useMultiFileAuthState('./temp_session');
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Chrome (Linux)", "", ""]
    });

    if (!sock.authState.creds.registered) {
        await delay(1500);
        const code = await sock.requestPairingCode(phoneNumber);
        return { code };
    }

    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'open') {
            await delay(5000);
            const creds = fs.readFileSync('./temp_session/creds.json');
            const sessionID = "DarkX-Ultra~" + Buffer.from(creds).toString('base64');
            
            await sock.sendMessage(sock.user.id, { 
                text: `*KIBABE SANA! DARKX SESSION ID*\n\nCopy kodi iliyo chini uka-deploy:\n\n\`\`\`${sessionID}\n\`\`\`\n\n> © MrX Developer - DarkX Project` 
            });
            
            console.log("Session ID sent to WhatsApp!");
            process.exit(0);
        }
    });
}

app.get('/pair', async (req, res) => {
    let phone = req.query.phone;
    if (!phone) return res.json({ error: "Weka namba ya simu!" });
    
    try {
        const result = await generateSession(phone);
        res.json({ pairingCode: result.code });
    } catch (e) {
        res.json({ error: "Imeshindwa!" });
    }
});

app.listen(port, () => console.log(`Site ipo hewani port ${port}`));
