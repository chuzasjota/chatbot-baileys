const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("baileys");

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    handleConnectionEvents(sock);
    handleMessageEvents(sock);
    sock.ev.on('creds.update', saveCreds);
}

function handleConnectionEvents(sock) {
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                connectWhatsApp();
            }
        } else if (connection === 'open') {
            console.log("CONNECTION OPEN!!!");
        }
    });
}

function handleMessageEvents(sock) {
    sock.ev.on('messages.upsert', async function (event) {
        const message = event.messages[0];
        const id = message.key.remoteJid;
        
        if (event.type !== 'notify' || id.includes("@g.us") || id.includes("@broadcast")) {
            return;
        }
        
        console.log(message);
        const name = message.pushName;

        await sock.readMessages([message.key], id);
        await sleep(200);
        await sock.sendPresenceUpdate("composing", id);
        await sleep(2000);

        await sendMessages(sock, id, message, name);
    });
}

async function sendMessages(sock, id, message, name) {
    await sock.sendMessage(id, { text: `Hello ${name}, greetings! I am a BOT` }, { quoted: message });
    await sock.sendMessage(id, { text: "Hello human, greetings! I am a BOT" });
    await sock.sendMessage(id, {
        text: `Hello ${name}, You can contact: @573113235006`,
        mentions: ['573113235006@s.whatsapp.net']
    });
    
    await sendLocation(sock, id);
    await sendContact(sock, id);
    await sendReaction(sock, id, message);
    await sendPreview(sock, id);
    await sendMedia(sock, id);
}

async function sendLocation(sock, id) {
    await sock.sendMessage(id, {
        location: { address: "Av. 6 de Agosto, Zone ABC", degreesLatitude: -16.489689, degreesLongitude: -68.119293 }
    });
}

async function sendContact(sock, id) {
    const vcard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + 'FN:Chuzasjota\n' + 'ORG:Ashoka Uni;\n' + 'TEL;type=CELL;type=VOICE;waid=573113235006:+573113235006\n' + 'END:VCARD';
    await sock.sendMessage(id, {
        contacts: {
            displayName: 'Chuzasjota',
            contacts: [{ vcard }]
        }
    });
}

async function sendReaction(sock, id, message) {
    await sock.sendMessage(id, {
        react: { text: '💖', key: message.key }
    });
}

async function sendPreview(sock, id) {
    await sock.sendMessage(id, { text: "You can visit my repository at: https://github.com/chuzasjota \n Feel free to contact me for any other inquiries." });
}

async function sendMedia(sock, id) {
    await sock.sendMessage(id, { image: { url: 'https://cdn.pixabay.com/photo/2022/04/04/16/42/technology-7111804_640.jpg' } });
    await sock.sendMessage(id, { 
        image: { url: 'https://cdn.pixabay.com/photo/2022/04/04/16/42/technology-7111804_640.jpg' },
        caption: 'Hello, here is the requested information...\n\n> _*Visit our website*_' 
    });
}

function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

connectWhatsApp();
