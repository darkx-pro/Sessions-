module.exports = async (sock, m) => {

    if (m.body === '.ping') {

        const start = Date.now()

        const msg = await sock.sendMessage(m.chat, {
            text: '🏓 Pinging...'
        }, {
            quoted: m
        })

        const speed = Date.now() - start

        await sock.sendMessage(m.chat, {
            text: `⚡ Speed: ${speed}ms`
        }, {
            quoted: msg
        })
    }
}