const store = {}

module.exports = async (sock, m, chatUpdate) => {

    if (m.message) {
        store[m.key.id] = m
    }

    const msg = chatUpdate.messages[0]

    if (msg.message?.protocolMessage?.type === 0) {

        const key = msg.message.protocolMessage.key.id

        const deleted = store[key]

        if (!deleted) return

        await sock.sendMessage(msg.key.remoteJid, {
            text: `⚠️ Deleted Message\n\n${deleted.body}`
        })
    }
}