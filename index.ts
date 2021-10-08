import { config } from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { Subject } from 'rxjs'
import { CollectedMessages, handleMessagesStreamByUser } from './handleMessages'
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

handleMessagesStreamByUser(messages$, 1000)
  .subscribe(({ messages, chatId, error }: CollectedMessages) => {
    messages && bot.sendMessage(chatId, messages.join('\n'))
    error && bot.sendMessage(chatId, error)
  })

