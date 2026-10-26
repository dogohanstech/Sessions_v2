const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');

const { upload } = require('./mega');

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
  const id = makeid();
  let num = req.query.number;

  async function HANS_XMD_PAIR_CODE() {
    const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
    try {
      var items = ["Safari"];
      function selectRandomItem(array) {
        var randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
      }
      var randomItem = selectRandomItem(items);

      let sock = makeWASocket({  
        auth: {  
          creds: state.creds,  
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),  
        },  
        printQRInTerminal: false,  
        generateHighQualityLinkPreview: true,  
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),  
        syncFullHistory: false,  
        browser: Browsers.macOS(randomItem)  
      });  
      
      if (!sock.authState.creds.registered) {  
        await delay(1500);  
        num = num.replace(/[^0-9]/g, '');  
        const code = await sock.requestPairingCode(num);  
        if (!res.headersSent) {  
          await res.send({ code });  
        }  
      }  
      
      sock.ev.on('creds.update', saveCreds);  
      sock.ev.on("connection.update", async (s) => {  
        const { connection, lastDisconnect } = s;  
        
        if (connection == "open") {  
          await delay(5000);  
          let rf = __dirname + `/temp/${id}/creds.json`;  

          try {  
            const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);  
            const string_session = mega_url.replace('https://mega.nz/file/', '');  

            // 1) Send session ID ONLY
            await sock.sendMessage(sock.user.id, {   
              text: `HansTz&${string_session}`  
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

          } catch (e) {   
            // silently ignore error   
          }   
          
          await delay(10);   
          await sock.ws.close();   
          await removeFile('./temp/' + id);   
          console.log(`👤 ${sock.user.id} Connected ✅ Restarting process...`);   
          await delay(10);   
          process.exit();   
        } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {   
          await delay(10);   
          HANS_XMD_PAIR_CODE();   
        }   
      });   
    } catch (err) {   
      await removeFile('./temp/' + id);   
      if (!res.headersSent) {   
        await res.send({ code: "❗ Service Unavailable" });   
      }   
    }   
  }   
  return await HANS_XMD_PAIR_CODE();
});

module.exports = router;