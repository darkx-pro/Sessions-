module.exports = async (sock, m) => {

    if (!m.isGroup) return

    const text = m.body || ''

    if (text.includes('chat.whatsapp.com')) {

        const metadata = await sock.groupMetadata(m.chat)

        const admins = metadata.participants
        .filter(v => v.admin)
        .map(v => v.id)

        const isAdmin = admins.includes(m.sender)

        if (isAdmin) return

        await sock.sendMessage(m.chat, {
            delete: m.key
        })

        await sock.sendMessage(m.chat, {
            text: '⚠️ Link detected. User removed.'
        })

        await sock.groupParticipantsUpdate(
            m.chat,
            [m.sender],
            'remove'
        )
    }
}