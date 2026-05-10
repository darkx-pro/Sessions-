module.exports = async (sock, m) => {

    if (!m.isGroup) return

    const metadata = await sock.groupMetadata(m.chat)

    const admins = metadata.participants
    .filter(v => v.admin)
    .map(v => v.id)

    const isAdmin = admins.includes(m.sender)

    if (m.body.startsWith('.kick')) {

        if (!isAdmin) return

        const users = m.message.extendedTextMessage?.contextInfo?.mentionedJid

        await sock.groupParticipantsUpdate(
            m.chat,
            users,
            'remove'
        )
    }

    if (m.body.startsWith('.promote')) {

        if (!isAdmin) return

        const users = m.message.extendedTextMessage?.contextInfo?.mentionedJid

        await sock.groupParticipantsUpdate(
            m.chat,
            users,
            'promote'
        )
    }

    if (m.body.startsWith('.demote')) {

        if (!isAdmin) return

        const users = m.message.extendedTextMessage?.contextInfo?.mentionedJid

        await sock.groupParticipantsUpdate(
            m.chat,
            users,
            'demote'
        )
    }

    if (m.body === '.tagall') {

        const members = metadata.participants.map(v => v.id)

        let teks = '📢 TAG ALL\n\n'

        for (let mem of members) {
            teks += `@${mem.split('@')[0]}\n`
        }

        await sock.sendMessage(m.chat, {
            text: teks,
            mentions: members
        })
    }
}