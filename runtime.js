module.exports = async (sock, m) => {

    if (m.body === '.runtime') {

        const uptime = process.uptime()

        const hours = Math.floor(uptime / 3600)
        const minutes = Math.floor((uptime % 3600) / 60)
        const seconds = Math.floor(uptime % 60)

        await sock.sendMessage(m.chat, {
            text: `⏱ Runtime: ${hours}h ${minutes}m ${seconds}s`
        }, {
            quoted: m
        })
    }
}