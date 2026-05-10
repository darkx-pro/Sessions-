"use strict";

const config = require('./config')
const fs = require('fs')
const path = require('path')
const pino = require('pino')
const chalk = require('chalk')
const readline = require('readline')
const { Buffer } = require('buffer')
const { smsg } = require('./serialize')

let makeWASocket,
    Browsers,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    delay,
    makeCacheableSignalKeyStore

const loadBaileys = async () => {
    const baileys = await import('@whiskeysockets/baileys')

    makeWASocket = baileys.default
    Browsers = baileys.Browsers
    useMultiFileAuthState = baileys.useMultiFileAuthState
    DisconnectReason = baileys.DisconnectReason
    fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion
    jidDecode = baileys.jidDecode
    delay = baileys.delay
    makeCacheableSignalKeyStore = baileys.makeCacheableSignalKeyStore
}

process.on("uncaughtException", console.log)
process.on("unhandledRejection", console.log)

const question = (text) => {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve) => {
        rl.question(text, resolve)
    })
}

const start = async () => {

    await loadBaileys()

    const sessionPath = path.join(__dirname, config.sessionName)

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath)
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(
                state.keys,
                pino({ level: 'silent' })
            )
        },
        browser: Browsers.ubuntu('Chrome'),
        version,
        printQRInTerminal: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true
    })

    if (!sock.authState.creds.registered) {

        console.log(chalk.cyan('\n=== DARKX ULTRA PAIRING ===\n'))

        let number = await question('Enter number:\n')

        number = number.replace(/[^0-9]/g, '')

        await delay(3000)

        const code = await sock.requestPairingCode(number)

        const final = code?.match(/.{1,4}/g)?.join('-') || code

        console.log(chalk.green(`\nPAIRING CODE: ${final}\n`))
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {

        const { connection, lastDisconnect } = update

        if (connection === 'open') {
            console.log(chalk.green(`\n${config.botName} Connected Successfully\n`))
        }

        if (connection === 'close') {

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

            if (shouldReconnect) {
                start()
            }
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {

        try {

            const mek = chatUpdate.messages[0]

            if (!mek.message) return

            const m = smsg(sock, mek)

            if (config.autoRead) {
                await sock.readMessages([mek.key])
            }

            if (config.autoTyping) {
                await sock.sendPresenceUpdate('composing', m.chat)
            }

            if (config.autoRecording) {
                await sock.sendPresenceUpdate('recording', m.chat)
            }

            const plugins = fs.readdirSync(__dirname)
            .filter(v => v.endsWith('.js'))
            .filter(v => ![
                'index.js',
                'config.js',
                'serialize.js'
            ].includes(v))

            for (let file of plugins) {
                require(`./${file}`)(sock, m, chatUpdate)
            }

        } catch (e) {
            console.log(e)
        }
    })

    return sock
}

start()