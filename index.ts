import { config } from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { groupBy, map, mergeMap, Subject } from 'rxjs'
import { groupMessagesCameTogether } from './handleMessages'
import { TelegramMessage } from './interface'

config()

const token = process.env.TOKEN

const bot = new TelegramBot(token, { polling: true })
const messages$ = new Subject<TelegramMessage>()

bot.on('channel_post', gotMessage)
bot.on('message', gotMessage)

function gotMessage(msg) {
  messages$.next(msg)
  // send a message to the chat acknowledging receipt of their message
  //bot.sendMessage(chatId, 'Received your message');
}

messages$.pipe(
  groupBy(({ chat }) => chat.id),
  mergeMap((messageStreamPerUser$) => {
    return groupMessagesCameTogether(messageStreamPerUser$)
      .pipe(map((messages: TelegramMessage[]) => ({ messages, chatId: messageStreamPerUser$.key })))
  })
).subscribe(({ messages, chatId }: { messages: TelegramMessage[], chatId: number }) => {
  bot.sendMessage(chatId, messages.join('\n'));
})

