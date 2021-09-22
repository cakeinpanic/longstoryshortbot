import { config } from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { groupBy, mergeMap, Subject } from 'rxjs'
import { groupMessagesCameTogether } from './handleMessages'

import { TelegramMessage } from './interface'

config()

const token = process.env.TOKEN

const bot = new TelegramBot(token, { polling: true })

const subj = new Subject<TelegramMessage>()

bot.on('channel_post', gotMessage)
bot.on('message', gotMessage)

function gotMessage(msg) {
  const chatId = msg.chat.id
  subj.next(msg)

  // send a message to the chat acknowledging receipt of their message
  //bot.sendMessage(chatId, 'Received your message');
}

subj.pipe(groupBy<TelegramMessage, number>(({ chat }) => chat.id), mergeMap(t => groupMessagesCameTogether(t))).subscribe(console.log)

