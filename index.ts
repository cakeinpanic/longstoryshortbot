import { config } from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { bufferTime, filter, groupBy, map, mergeMap, Subject } from 'rxjs'

config()

const token = process.env.TOKEN

interface Message {
  message_id: number
  from: {
    id: number,
    is_bot: boolean,
    first_name: string
    username: string
    language_code: string
  },
  chat: {
    id: number,
    first_name: string
    username: string
    type: string
  },
  date: number,
  forward_from: {
    id: number,
    is_bot: boolean,
    first_name: string,
    username: string,
    language_code: string
  },
  forward_date: number,
  text: number
}

const bot = new TelegramBot(token, { polling: true })

const subj = new Subject<Message>()

bot.on('channel_post', gotMessage)
bot.on('message', gotMessage)

function gotMessage(msg) {
  const chatId = msg.chat.id
  subj.next(msg)

  // send a message to the chat acknowledging receipt of their message
  //bot.sendMessage(chatId, 'Received your message');
}

subj.pipe(groupBy(({ chat }) => chat.id), mergeMap(group => {
  return group.pipe(bufferTime(1000), filter(t => t.length > 0), map(data => ({ data, key: group.key })))
})).subscribe(t => {
  console.log(t)
})
