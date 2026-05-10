exports.smsg = (sock, m) => {

    if (!m.message) return m

    m.chat = m.key.remoteJid
    m.fromMe = m.key.fromMe
    m.sender = m.key.participant || m.key.remoteJid

    m.isGroup = m.chat.endsWith('@g.us')

    const type = Object.keys(m.message)[0]

    m.type = type

    m.body =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption ||
        ""

    return m
}