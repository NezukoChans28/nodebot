const { MessageType, Mimetype } = require("@adiwajshing/baileys")
const { WAConnection } = require('@adiwajshing/baileys/lib/WAConnection/0.Base')
const ffmpeg = require("fluent-ffmpeg")
const axios = require("axios")
const fs = require("fs")

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
      * @params {String} id 
      */
      async sendSticker(from, attachment, id) {
        let media = await this.downloadAndSaveMediaMessage(attachment)
          let file = "sticker.webp"
          await ffmpeg("./" + media)
          .input(media)
          .on("error", (err) => console.log(err))
          .on("end", () => {
            this.sendMessage(from, fs.readFileSync(file), MessageType.sticker, { quoted: m })
            fs.unlinkSync(media)
            fs.unlinkSync(file)
          })
          .addOutputOptions([
            "-vcodec", "libwebp",
            "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
            "-loop", "0",
            "-an",
            "-vsync", "0"
            ])
          .toFormat("webp")
          .save(file)
      }
      /**
       * Simple Method To Send Image 
       * @params {String} from 
       * @params {String || Buffer} content 
       * @params {String} caption
       * @params {String} id 
       */
       async sendImage(from, content, caption, id) {
         let captJid = [...caption.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
         return this.sendMessage(from, content, MessageType.image, { quoted: id, caption: caption, mimetype: Mimetype.jpeg, contextInfo: { mentionedJid: captJid } } )
       }
  }
  return WAConnection
}
