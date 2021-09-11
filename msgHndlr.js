const axios = require("axios")
const chalk = require("chalk")
const fs = require("fs")
const moment = require("moment")
const moments = require("moment-timezone")
const yts = require("yt-search")

const help = require("./lib/help.js")
const settings = JSON.parse(fs.readFileSync("./settings.json"))

moment.tz.setDefault("Asia/Jakarta").locale("id");

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
    let pushname = sender.split("@")[0]
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
      wait: "*[WAIT]* Silahkan Tunggu!",
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

    // AUTO RESPON
    if (m.message.conversation.includes("Bot")) {
      client.reply(from, "Haik Onii-Chann, BOT Disini, Ketikkan *#menu* Untuk List Fitur BOT", id)
    }
    
    //return console.log(m.message)
 
    switch (command) {
      case "help":
      case "menu":
        return client.reply(from, help.help(sender, prefix), id)
        break;
      case "owner":
      case "creator":
      case "admin": {
        return client.reply(from, `Terimakasih Telah Menggunakan Bot Ini\nAdmin BOT\n@${settings.ownerNumber[0].split("@")[0]}`, id)
      }
      break
      
      // FITUR MAKER 
      case "stiker": 
      case "sticker": {
        if (isMediaMsg || isQuotedImage) {
          let encmedia = isQuotedImage ? JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message.extendedTextMessage.contextInfo : m 
          return client.sendSticker(from, encmedia, "StickerBy", "BOTZ", id)
        } else {
          let encmedia = isQuotedVideo ? JSON.parse(JSON.stringify(m).replace("quotedM", "m")).message.extendedTextMessage.contextInfo : m 
          return client.sendSticker(from, encmedia, "StickerBy", "BOTZ", id)
        }
      }
      break
      case "nulis": {
        try {
        if (args.length === 0) return client.reply(from, "Masukkan sebuah text\n\nContoh : *" + prefix + "nulis* NezukoChans", id) 
        return client.sendImage(from, { url : "https://api.xteam.xyz/magernulis2?text=" + q + "&APIKEY=" + settings.apiXteam + "" }, "Done Kak @" + sender.split("@")[0], id)
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id)
      }
    }
      break
      case "neon": {
        if (args.length === 0) return client.reply(from, "Masukkan Sebuah Teks!\n\nContoh: *" + prefix + "neon* BOT", id)
        await client.sendImage(from, { url: "https://api.xteam.xyz/textpro/neon?text=" + q + "&APIKEY=" + settings.apiXteam + "" }, "Neon Maker", id)
      }
      break
      case "bpink":
      case "blackpink": {
        if (args.length === 0) return client.reply(from, "Masukkan Sebuah Teks!\n\nContoh: *" + prefix + "bpink* BOT", id)
        await client.sendImage(from, { url: "https://api.xteam.xyz/textpro/blackpink?text=" + q + "&APIKEY=" + settings.apiXteam + "" }, "Blackpink Maker", id)
      }
      break
      // FITUR DOWNLOADER
      case "ig": 
      case "instagram": {
        try {
        if (args.length === 0) return client.reply(from, "Masukkan Url Instagram!\n\nContoh: *" + prefix + "instagram* https://www.instagram.com/p/CTBia0mhRhu/?utm_medium=copy_link", id)
        client.reply(from, mess.wait, id)
        let { data } = await axios.get("https://api.xteam.xyz/dl/ig?url=" + args[0] + "&APIKEY=" + settings.apiXteam + "")
        let { name, username, likes, caption } = data.result
        let captions = `Name : *${name}*\nUsername : *${username}*\nLikes : *${likes}*\nCaption :\n${caption}`
        for (let i = 0; i < data.result.data.length; i++) {
          if (data.result.data[i].type == "image") {
            await client.sendImage(from, { url: data.result.data[i].data }, captions, id)
          } else {
            await client.sendVideo(from, { url : data.result.data[i].data}, captions, id)
          }
        }
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id)
      }
    }
      break 
      case "tik": 
      case "tiktok": {
        try {
        if (args.length === 0) return client.reply(from, "Masukkan Url Tiktok!\n\nContoh : *" + prefix + "tiktok* https://vt.tiktok.com/ZSJc2PkTM/", id)
        client.reply(from, mess.wait, id)
        let { data } = await axios.get("https://api.xteam.xyz/dl/tiktok?url=" + args[0] + "&APIKEY=" + settings.apiXteam + "")
        let { server_1 } = data 
        let captions = `Nickname : *${data.info[0].authorMeta.nickName}*\nUsername : *${data.info[0].authorMeta.name}*\nCaption :\n${data.info[0].text}`
        await client.sendVideo(from, { url : server_1 }, captions, id)
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id, { quoted: m })
      }
    }
      break 
      case "ytmp3": {
        try {
        if (args.length === 0) return client.reply(from, "Masukkan Url YouTube\n\nContoh : *" + prefix + "ytmp3* https://youtu.be/7zhBmglx6nY", id)
        client.reply(from, mess.wait, id)
        let { data } = await axios.get("https://youtube-media-downloader.shellyschan.repl.co/?url=" + args[0])
        let { judul, deskripsi, thumbnail, audio } = data 
        let captions = `Judul : *${judul}*\nDeskripsi : *${deskripsi}*`
        await client.sendImage(from, { url : thumbnail + ".jpg" }, captions, id)
        await client.sendAudio(from, { url : audio }, judul + ".mp3", id)
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id)
      }
    }
      break 
      case "ytmp4": {
        try {
        if (args.length === 0) return client.reply(from, "Masukkan Url YouTube\n\nContoh : *" + prefix + "ytmp4* https://youtu.be/7zhBmglx6nY", id)
        client.reply(from, mess.wait, id)
        let { data } = await axios.get("https://youtube-media-downloader.shellyschan.repl.co/?url=" + args[0])
        let { judul, deskripsi, thumbnail, video } = data 
        let captions = `Judul : *${judul}*\nDeskripsi : *${deskripsi}*`
        await client.sendImage(from, { url : thumbnail + ".jpeg" }, captions, id)
        await client.sendVideo(from, { url : video }, null, id)
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id)
      }
    }
      break
      case "facebook": 
      case "fb": {
        try {
        if (args.length === 0) return client.reply(from, "Masukkan Url Facebook\n\nContoh : *" + prefix + "fb* https://www.facebook.com/botikaonline/videos/837084093818982", id)
        client.reply(from, mess.wait, id)
        let { data } = await axios.get("https://api.xteam.xyz/dl/fbv2?url=" + args[0] + "&APIKEY=" + settings.apiXteam + "")
        let { hd } = data.result
        let captions = `Judul : *${data.result.meta.title}*`
        await client.sendVideo(from, { url : hd.url }, captions, id)
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id)
      }
    }
      break 
      case "igstalk":
      case "igprofile": {
        try {
        if (args.length === 0) return client.reply(from, "Masukkan Username Instagram\n\nContoh : *" + prefix + "igprofile* nezuko.chan.12", id)
        let { data } = await axios.get("https://api.xteam.xyz/dl/igstalk?nama=" + args[0] + "&APIKEY=" + settings.apiXteam + "")
        let { username, full_name, follower_count, following_count, biography, hd_profile_pic_url_info } = data.result.user
        let captions = `Username : *${username}*\nFull Name : *${full_name}*\nFollower : *${follower_count}*\nFollowing : *${following_count}*\nBio : *${biography}*`
        await client.sendImage(from, { url : hd_profile_pic_url_info.url }, captions, id)
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id)
      }
    }
      break
      case "play": {
        try {
        if (args.length === 0) return client.reply(from, "Masukkan Judul Lagu!\n\nContoh : *" + prefix + "play* Bahagia Itu Sederhana", id)
        client.reply(from, mess.wait, id)
        let urlYt = await yts(q)
        let { data } = await axios.get("https://youtube-media-downloader.shellyschan.repl.co/?url=" + urlYt.all[0].url)
        let { judul, deskripsi, thumbnail, audio } = data 
        let captions = `Judul : *${judul}*\nDeskripsi : *${deskripsi}*`
        await client.sendImage(from, { url : thumbnail + ".jpg" }, captions, id)
        await client.sendAudio(from, { url : audio }, judul + ".mp3", id)
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id)
      }
    }
      break
      // FITUR ANIME
      case "waifu": {
        return client.sendImage(from, { url: "https://animerestapi.herokuapp.com/waifu" }, null, id)
      }
      break
      case "husbu": {
        return client.sendImage(from, { url: "https://animerestapi.herokuapp.com/husbu" }, null, id)
      }
      break
      case "neko": {
        return client.sendImage(from, { url: "https://animerestapi.herokuapp.com/neko" }, null, id)
      }
      break
      case "animesearch":
      case "anime": {
        try {
        if (args.length === 0) return client.reply(from, "Masukkan Nama Anime!\n\nContoh: *" + prefix + "animesearch* Kanojo Okarishimasu", id)
        let { data } = await axios.get("https://animerestapi.herokuapp.com/animesearch?anime=" + q)
        let { thumb, title, info, synopsis, url_download } = await data
        let captions = `Title : *${title}*\n\nInfo : *${info}*\n\nSinopsis :\n*${synopsis}*\n\nUrl Download :\n*${url_download}*`
        await client.sendImage(from, { url: thumb }, captions, id)
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id)
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
        client.reply(from, mess.err, id, { quoted: m })
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
        client.reply(from, mess.err, id, { quoted: m })
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
        client.reply(from, mess.err, id)
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
        client.reply(from, mess.err, id)
      }
    } 
    break 
    case "settname" : {
      try {
        if (!isGroupMsg) return client.reply(from, mess.grp.notGrp, id)
        if (!isAdminGroup) return client.reply(from, mess.grp.notAdm, id)
        if (!isAdminBotGroup) return client.reply(from, mess.grp.notBotAdm, id)
        if (args.length === 0) return client.reply(from, "Masukkan Nama Group Yang baru!\n\nContoh : *" + prefix + "settname* Nama Group Yang Baru", id)
        return client.groupUpdateSubject(from, q)
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id)
      }
    }
    break
      case "settdesc": {
      try {
        if (!isGroupMsg) return client.reply(from, mess.grp.notGrp, id)
        if (!isAdminGroup) return client.reply(from, mess.grp.notAdm, id)
        if (!isAdminBotGroup) return client.reply(from, mess.grp.notBotAdm, id)
        if (args.length === 0) return client.reply(from, "Masukkan Deskripsi Group Yang baru!\n\nContoh : *" + prefix + "settdesc* Deskripsi Group Yang Baru", id)
        return client.groupUpdateDescription(from, q)
      } catch (e) {
        console.log(e)
        client.reply(from, mess.err, id)
      }
    }
    break      
    case "mentionall":
    case "tagall": {
        if (!isGroupMsg) return client.reply(from, mess.grp.notGrp, id)
        if (!isAdminGroup) return client.reply(from, mess.grp.notAdm, id)
        let { participants, subject } = await groupData
        let captions = "Mention All Members *" + subject + "*"
        let mem = []
        for (let i of participants) {
          mem.push(i.jid)
        }
        await client.sendMessage(from, captions, MessageType.text, { quoted: id, contextInfo: { mentionedJid: mem } } )
    }
    break
    case "groupinfo": {
        if (!isGroupMsg) return client.reply(from, mess.grp.notGrp, id)
        let { subject, creation, desc, participants } = await groupData
        let captions = `Name : *${subject}*\nCreation Date : *${moment(`${creation}` * 1000).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')}*\nParticpants Length : *${participants.length}*\nAdmin Length : *${groupAdmin.length}*\nDescription :\n*${desc}*`
        await client.sendImage(from, { url: await client.getProfilePicture(from) }, captions, id)
    }
    break
      default:
        console.log(chalk.redBright("[ERROR] UNREGISTERED COMMAND FROM " + pushname))
    }
  } catch (e) {
    console.log(e)
  }
}
