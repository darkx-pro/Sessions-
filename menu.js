const fs = require('fs');
const path = require('path');

module.exports = async (sock, m) => {
    if (m.body === '.menu') {
        // 1. Soma mafaili yote kwenye folder la sasa
        const files = fs.readdirSync(__dirname);

        // 2. Chuja mafaili ambayo ni plugins (yenye .js) 
        // na ondoa yale ambayo siyo amri (kama index.js, config.js, nk)
        const ignoredFiles = [
            'index.js', 
            'config.js', 
            'serialize.js', 
            'database.json', 
            'package.json',
            'menu.js' // Tunaitoa menu yenyewe isijitaje kwenye list
        ];

        const commands = files
            .filter(file => file.endsWith('.js') && !ignoredFiles.includes(file))
            .map(file => `┃ .${file.replace('.js', '')}`) // Toa .js ili ibaki jina la amri
            .sort(); // Panga kwa herufi (A-Z)

        // 3. Tengeneza muonekano wa Menu
        let menuText = `
╭━━〔 DARKX ULTRA 〕━━⬣
┃ 👑 Owner : MrX Dev
┃ ⚡ Fast & Stable
┃ 🔥 Version : 2.0
┃ 📂 Plugins Loaded: ${commands.length}
╰━━━━━━━━━━━━━━⬣

╭─❍ ALL COMMANDS\n`;

        menuText += commands.join('\n');
        menuText += `\n╰──────────⬣`;

        await sock.sendMessage(m.chat, {
            text: menuText
        }, {
            quoted: m
        });
    }
}
