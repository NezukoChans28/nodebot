const axios = require("axios")
const fs = require("fs")
const ffmpeg = require("fluent-ffmpeg")
const chalk = require("chalk")
const moment = require("moment")

const help = require("./lib/help.js")
const settings = JSON.parse(fs.readFileSync("./settings.json"))

module.exports = msgHandler = async (WAConnection, MessageType, Mimetype, msg, client) => {
  try {
    if (!msg.hasNewMessage) return 
    if (!msg.messages) return
    m = msg.messages.all()[0]
    if (!m.message) return 
    if (m.key && m.key.remoteJid == "status@broadcast") return
    if (m.key.fromMe) return
        
    let prefix = "#"
    let type = Object.keys(m.message)[0]
    let from = m.key.remoteJid 
    let id = m
    let isGroupMsg = from.includes("@g.us")
    let groupData = isGroupMsg ? await client.groupMetadata(from) : ""
    let getGroupAdmin = isGroupMsg ? groupData.participants.filter(x => x.isAdmin === true) : ""
    let groupAdmin = isGroupMsg ? getGroupAdmin.map(x => x.jid) : ""
    let sender = isGroupMsg ? m.participant : from 
    let pushname = await client.contacts[sender].notify
    let time = moment(msg.t * 1000).format('HH:mm:ss')
    let quotedMsg = JSON.stringify(m.message)
    let body = (type === "conversation") && m.message.conversation.startsWith(prefix) ? m.message.conversation : (type === "imageMessage") && m.message.imageMessage.caption.startsWith(prefix) ? m.message.imageMessage.caption : (type === "videoMessage") && m.message.videoMessage.caption.startsWith(prefix) ? m.message.videoMessage.caption : (type === "extendedTextMessage") && m.message.extendedTextMessage.text.startsWith(prefix) ? m.message.extendedTextMessage.text : ""
    let command = body.slice(1).trim().split(" ").shift().toLowerCase()
    let isCmd = body.startsWith(prefix)
    let args = body.trim().split(" ").slice(1)
    let q = args.join(" ")
    
    let isOwner = settings.ownerNumber.includes(sender)
    let isAdminGroup = groupAdmin.includes(sender)
    let isAdminBotGroup = groupAdmin.includes(client.user.jid)
    let isMediaMsg = (type === "imageMessage" || type === "videoMessage")
    let isQuotedImage = (type === "extendedTextMessage") && quotedMsg.includes("imageMessage")
    let isQuotedVideo = (type === "extendedTextMessage") && quotedMsg.includes("videoMessage")

    if (isCmd && !isGroupMsg) console.log(chalk.yellow("[EXEC] ") + time + chalk.green(" " + prefix + command) + " FROM " + chalk.green(pushname))
    if (isCmd && isGroupMsg) console.log(chalk.yellow("[EXEC] ") + time + chalk.green(" " + prefix + command) + " FROM " + chalk.green(pushname) + " IN " + chalk.green(groupData.subject))
    
    let mess = {
      err: "*[ERROR]* Silahkan Lapor Admin!",
      grp: {
        notGrp: "Fitur Ini Khusus Group!",
        notAdm: "Kamu Bukanlah Admin Group!",
        notBotAdm: "Jadikan Bot Admin Group!"
      },
      notOwn: "Kamu Bukanlah Owner Bot!"
    }
    
    // AUTO READ
    client.chatRead(from, "read")
    
    // ALWAYS ONLINE
    client.updatePresence(from, "available")
    
    switch (command) {
      case "help":
      case "menu":
        return client.reply(from, help.help(sender, prefix), id)
        break;
        
      // FITUR UTAMA
      case "sticker": {
        if (isMediaMsg || isQuotedImage || isQuotedVideo) {
          let encmedia = isQuotedImage ? JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message.extendedTextMessage.contextInfo : m 
          return client.sendSticker(from, encmedia, id)
        }
      }
      break 
      case "ig": 
      case "instagram": {
        try {
        if (args.length === 0) return client.sendMessage(from, "Masukkan Url Instagram!\n\nContoh: *" + prefix + "instagram* https://www.instagram.com/p/CTBia0mhRhu/?utm_medium=copy_link", MessageType.text, { quoted: m, detectLinks: false })
        let { data } = await axios.get("https://api.xteam.xyz/dl/ig?url=" + args[0] + "&APIKEY=" + settings.apiXteam + "")
        let { name, username, likes, caption } = data.result
        let captions = `Name : *${name}*\nUsername : *${username}*\nLikes : *${likes}*\nCaption :\n${caption}`
        for (let i = 0; i < data.result.data.length; i++) {
          if (data.result.data[i].type == "image") {
            await client.sendImage(from, { url: data.result.data[i].data }, captions, id)
          } else {
            await client.sendMessage(from, { url : data.result.data[i].data}, MessageType.video, { quoted: m, caption: captions, mimetype: Mimetype.mp4})
          }
        }
      } catch (e) {
        console.log(e)
        client.sendMessage(from, mess.err, MessageType.text, { quoted: m })
      }
    }
      break 
      case "tik": 
      case "tiktok": {
        try {
        if (args.length === 0) return client.sendMessage(from, "Masukkan Url Tiktok!\n\nContoh : *" + prefix + "tiktok* https://vt.tiktok.com/ZSJc2PkTM/", MessageType.text, { quoted: m, detectLinks: true })
        let { data } = await axios.get("https://api.xteam.xyz/dl/tiktok?url=" + args[0] + "&APIKEY=" + settings.apiXteam + "")
        let { server_1 } = data 
        let captions = `Nickname : *${data.info[0].authorMeta.nickName}*\nUsername : *${data.info[0].authorMeta.name}*\nCaption :\n${data.info[0].text}`
        await client.sendMessage(from, { url : server_1 }, MessageType.video, { quoted: m, caption: captions, mimetype: Mimetype.mp4 })
      } catch (e) {
        console.log(e)
        client.sendMessage(from, mess.err, MessageType.text, { quoted: m })
      }
    }
      break 
      
      // FITUR GROUP 
      /*case "add": {
        try {
        if (!isGroupMsg) return client.reply(from, mess.grp.notGrp, id)
        if (!isAdminGroup) return client.reply(from, mess.grp.notAdm, id)
        if (!isAdminBotGroup) return client.reply(from, mess.grp.notBotAdm, id)
        if (!q) return client.reply(from, "Masukkan Nomor Target!\n\nContoh : *" + prefix + "add* 628×××", id)
        return client.groupAdd(from, [q + "@s.whatsapp.net"])
      } catch (e) {
        console.log(e)
        client.sendMessage(from, mess.err, MessageType.text, { quoted: m })
      }
    }
      break 
      case "kick": {
        try {
        if (!isGroupMsg) return client.reply(from, mess.grp.notGrp, id)
        if (!isAdminGroup) return client.reply(from, mess.grp.notAdm, id)
        if (!isAdminBotGroup) return client.reply(from, mess.grp.notBotAdm, id)
        if (!q) return client.reply(from, "Masukkan Nomor Target!\n\nContoh : *" + prefix + "kick* 628×××", id)
        return client.groupRemove(from, [q + "@s.whatsapp.net"])
      } catch (e) {
        console.log(e)
        client.sendMessage(from, mess.err, MessageType.text, { quoted: m })
      }
    }
    break 
    */
    case "promote": {
      try {
        if (!isGroupMsg) return client.reply(from, mess.grp.notGrp, id)
        if (!isAdminGroup) return client.reply(from, mess.grp.notAdm, id)
        if (!isAdminBotGroup) return client.reply(from, mess.grp.notBotAdm, id)
        if (!q) return client.reply(from, "Tag Nomor Target!\n\nContoh : *" + prefix + "promote* @user", id)
        if (!m.message.extendedTextMessage) return client.reply(from, "Tag Nomor Target!\n\nContoh : *" + prefix + "add* @user", id) 
        return client.groupMakeAdmin(from, m.message.extendedTextMessage.contextInfo.mentionedJid)
      } catch (e) {
        console.log(e)
        client.sendMessage(from, mess.err, MessageType.text, { quoted: m })
      }
    }
    break 
    case "demote": {
      try {
        if (!isGroupMsg) return client.reply(from, mess.grp.notGrp, id)
        if (!isAdminGroup) return client.reply(from, mess.grp.notAdm, id)
        if (!isAdminBotGroup) return client.reply(from, mess.grp.notBotAdm, id)
        if (!q) return client.reply(from, "Tag Nomor Target!\n\nContoh : *" + prefix + "demote* @user", id)
        if (!m.message.extendedTextMessage) return client.reply(from, "Tag Nomor Target!\n\nContoh : *" + prefix + "add* @user", id) 
        return client.groupDemoteAdmin(from, m.message.extendedTextMessage.contextInfo.mentionedJid)
      } catch (e) {
        console.log(e)
        client.sendMessage(from, mess.err, MessageType.text, { quoted: m })
      }
    } 
    break
      
      default:
        console.log(chalk.redBright("[ERROR] UNREGISTERED COMMAND FROM " + pushname))
    }
  } catch (e) {
    console.log(e)
  }
}
