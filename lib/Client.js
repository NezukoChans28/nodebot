const { MessageType, Mimetype } = require("@adiwajshing/baileys")
const { WAConnection } = require('@adiwajshing/baileys/lib/WAConnection/0.Base')
const ffmpeg = require("fluent-ffmpeg")
const axios = require("axios")
const fs = require("fs")
const { sticker } = require("./sticker.js")

exports.WAConnection = _WAConnection => {
  class WAConnection extends _WAConnection {
    constructor(...args) {
      super(...args)
    }
    /**
     * Simple Method To Reply Message 
     * @params {String} from 
     * @params {String} content 
     * @params {String} id 
     */
     async reply(from, content, id) {
       let menJid = [...content.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
       return this.sendMessage(from, `${content}`, MessageType.text, { quoted: id, detectLinks: false, contextInfo: { mentionedJid: menJid } } )
     }
     /**
      * Simple Method To Send Sticker 
      * @params {String} from 
      * @params {String} attachment 
      * @params {String} packname 
      * @params {String} authorname
      * @params {String} id 
      */
      async sendSticker(from, attachment, packname, authorname, id) {
        let media = await this.downloadAndSaveMediaMessage(attachment)
        return this.sendMessage(from, await sticker(fs.readFileSync(media), false, packname, authorname), MessageType.sticker, { quoted: id, mimetype: Mimetype.webp })
      }
      /**
       * Simple Method To Send Image 
       * @params {String} from 
       * @params {String || Buffer} content 
       * @params {String} caption
       * @params {String} id 
       */
       async sendImage(from, content, caption, id) {
         let captJid = caption ? [...caption.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net') : ""
         return this.sendMessage(from, content, MessageType.image, { quoted: id, caption: caption, mimetype: Mimetype.jpeg, contextInfo: { mentionedJid: captJid } } )
       }
      /**
       * Simple Method To Send Video 
       * @params {String} from 
       * @params {String || Buffer} content 
       * @params {String} caption
       * @params {String} id 
       */
       async sendVideo(from, content, caption, id) {
         let captJid = caption ? [...caption.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net') : ""
         return this.sendMessage(from, content, MessageType.video, { quoted: id, caption: caption, mimetype: Mimetype.mp4, contextInfo: { mentionedJid: captJid } } )
       }
       /**
       * Simple Method To Send Audio 
       * @params {String} from 
       * @params {String || Buffer} content 
       * @params {String} filename
       * @params {String} id 
       */
       async sendAudio(from, content, filename, id) {
         // let captJid = [...caption.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
         return this.sendMessage(from, content, MessageType.audio, { quoted: id, mimetype: Mimetype.mp4Audio, filename: filename } )
       }
  }
  return WAConnection
}
