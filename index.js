const { WAConnection: _WAConnection, MessageType, Mimetype } = require("@adiwajshing/baileys")
const fs = require("fs")
const msgHandler = require("./msgHndlr.js")
const _client = require("./lib/Client.js")
const chalk = require("chalk")
const CFonts = require("cfonts")
const WAConnection = _client.WAConnection(_WAConnection)

async function starts() {
  const client = new WAConnection()
  client.logger.level = "warn"

  client.on("qr", () => console.log("SCAN THIS QR!"))
  fs.existsSync("./session.json") && client.loadAuthInfo("./session.json")
  let nodeBot = CFonts.render("NodeBOT|By|NezukoChans", {
    font: "simple",
    align: "center",
    gradient: ["red", "green"],
    lineHeight: 3
  })
  
  console.log(nodeBot.string)
  
  client.on("connecting", () => console.log(chalk.green("[CONNECTING] Connecting...")))
  client.on("open", () => console.log(chalk.green("[READY] WhatsApp BOT Ready!")))
  await client.connect({ timeoutMs: 30*1000 })
  fs.writeFileSync("./session.json", JSON.stringify(client.base64EncodedAuthInfo(), null, "\t"))
  
  client.on("chat-update", (msg) => {
    msgHandler(WAConnection, MessageType, Mimetype, msg, client)
  })
  
}

starts()
.catch(e => console.log(e))
