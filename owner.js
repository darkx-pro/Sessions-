const config = require('./config')

module.exports = async (sock, m) => {

    if (m.body === '.owner') {

        await sock.sendMessage(m.chat, {
            text: `👑 Owner: ${config.ownerName}`
        }, {
            quoted: m
        })
    }
}