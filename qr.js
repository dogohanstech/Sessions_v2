const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers } = require("@whiskeysockets/baileys");
const { makeid } = require('./gen-id');
const { upload } = require('./mega');

const router = express.Router();

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true });
  }
}

router.get('/', async (req, res) => {
  const id = makeid();

  async function startSession() {  
    const { state, saveCreds } = await useMultiFileAuthState(`./temp/${id}`);  

    try {  
      const sock = makeWASocket({  
        auth: state,  
        printQRInTerminal: false,  
        logger: pino({ level: "silent" }),  
        browser: Browsers.macOS("Desktop")  
      });  

      sock.ev.on('creds.update', saveCreds);  

      sock.ev.on("connection.update", async (update) => {  
        const { connection, lastDisconnect, qr } = update;  

        if (qr) {  
          return res.end(await QRCode.toBuffer(qr));  
        }  

        if (connection === "open") {  
          await delay(5000);  

          const credsPath = `${__dirname}/temp/${id}/creds.json`;  
          const sessionStream = fs.createReadStream(credsPath);  

          try {  
            const megaUrl = await upload(sessionStream, `${sock.user.id}.json`);  
            const sessionId = megaUrl.replace('https://mega.nz/file/', '');  

            // 1) Send session ID message ONLY
            await sock.sendMessage(sock.user.id, {  
              text: `HansTz&${sessionId}`  
            });  

            // 2) Send promo message WITHOUT session ID
            const sessionCaptions = [
  `
╔━━〔 ✅ SESSION CONNECTED 〕━━━
┃ 👋 Hello, Operator!
┃ 🔐 Session ID is now active.
┃ 🔁 Use in: SESSION_ID variable
┃ 🤖 Thanks for using our bot!
╚━━━━━━━━━━━━━━━━━━━━
`,
  `
⟿ SYSTEM LOG >>> SESSION ONLINE ✅
┌────────────────────┐
│ 🧠 User Authenticated         
│ 🔒 SESSION_ID Acquired        
│ 🧬 Inject into ENV Variable   
│ 🤖 Bot Ready for Commands     
└────────────────────┘
`,
  `
🟢 [SESSION ONLINE] - ACCESS GRANTED 🟢
━━━━━━━━━━━━━━━━━━━━━━━
🧑‍💻 Welcome, Operator.
🛡️ Keep your SESSION_ID private.
📥 Input it into: SESSION_ID
💾 Bot system booted successfully.
━━━━━━━━━━━━━━━━━━━━━━━
`,
  `
[!] SESSION CONNECTED [STATUS: GREEN]
------------------------------------------------------------------------------
> ID: SECURED
> VAR: SESSION_ID
> MISSION: BOT ENGAGED
> CAUTION: DO NOT SHARE THIS ID
-------------------------------------------------------------------------------
`,
  `
> ✅ SESSION CONNECTED
> 👋 Hello! Your session is active.
> 🔐 Do NOT share your SESSION_ID.
> 📌 Use it in: SESSION_ID variable.
> 🤖 Thank you for choosing our bot.
`,
  `
╔════ SESSION CONNECTED ═════╗
║ 👋 Welcome, Agent                  
║ 🔒 SESSION_ID: Keep it secret!     
║ 💡 Use in config as SESSION_ID     
║ 🤖 Bot is now operational          
╚═════════════════════╝
`,
  `
🚨🔥 SESSION CONNECTED 🔥🚨
━━━━━━━━━━━━━━━━━━━━━━
👋 Welcome, user!
🔐 SESSION_ID secured.
🧾 Apply to: SESSION_ID var.
🤖 Thanks for using the bot!
━━━━━━━━━━━━━━━━━━━━━━
`,
  `
[BOOT LOG] :: SESSION ONLINE
-----------------------------------------------------
> Welcome back, Commander.
> SESSION_ID secured ✅
> Use in: SESSION_ID var
> Bot is standing by 🤖
-----------------------------------------------------
`,
  `
🛡️ ━━ SESSION ACTIVE ━━ 🛡️
> 🔐 Keep your SESSION_ID safe!
> 📌 Place in: SESSION_ID variable
> 🤖 Bot system is ready
> 👋 Hello, and welcome!
`,
  `
💻 SYSTEM ALERT: SESSION CONNECTED ✅
━━━━━━━━━━━━━━━━━━━━━━━━
🧑‍💻 Hello Agent,
🔐 Secure your SESSION_ID at all costs.
📍 ENV Variable: SESSION_ID
🤖 Bot Module: Online & Synced
━━━━━━━━━━━━━━━━━━━━━━━━
`
];

// Pick a random style
const randomCaption = sessionCaptions[Math.floor(Math.random() * sessionCaptions.length)];

await sock.sendMessage(sock.user.id, {
  image: { url: "https://files.catbox.moe/r3x9ar.jpg" },
  caption: randomCaption,
  contextInfo: {
    forwardingScore: 5,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterName: "𝐻𝒂𝒏𝒔𝑇𝒆𝒄𝒉",
      newsletterJid: "120363352087070233@newsletter",
    },
  },
});

          } catch { /* silently ignore errors */ }  

          await delay(10);  
          await sock.ws.close();  
          removeFile(`./temp/${id}`);  
          console.log(`👤 ${sock.user.id} Connected ✅ Restarting process...`);  
          await delay(10);  
          process.exit();  
        } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {  
          await delay(10);  
          startSession();  
        }  
      });  

    } catch (err) {  
      removeFile(`./temp/${id}`);  
      if (!res.headersSent) {  
        res.send({ code: "❗ Service Unavailable" });  
      }  
    }  
  }  

  await startSession();

});

module.exports = router;