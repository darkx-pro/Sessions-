module.exports = async (sock, m) => {

    if (m.body === '.alive') {

        await sock.sendMessage(m.chat, {
            text: `
╭━━〔 DARKX ULTRA 〕━━⬣
┃ 🤖 Status : Online
┃ ⚡ Speed : Stable
┃ 👑 Owner : MrX Dev
╰━━━━━━━━━━━━━━⬣
`
        }, {
            quoted: m
        })
    }
}