import { config } from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { Subject } from 'rxjs'
import { handleMessagesStreamByUser } from './handleMessages'
import { TelegramMessage } from './interface'

config()

const token = process.env.TOKEN

const bot = new TelegramBot(token, { polling: true })
const messages$ = new Subject<TelegramMessage>()

bot.on('channel_post', gotMessage)
bot.on('message', gotMessage)

function gotMessage(msg) {
  messages$.next(msg)
}

handleMessagesStreamByUser(messages$)

