import { config } from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { Subject } from "rxjs";
import {
  CollectedMessages,
  handleMessagesStreamByUser,
} from "./handleMessages";
import { TelegramMessage } from "./interface";

config();

const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });
const messages$ = new Subject<TelegramMessage>();

bot.on("message", gotMessage);

function gotMessage(msg) {
  console.log(JSON.stringify(msg, null, 2))
  messages$.next(msg);
}

handleMessagesStreamByUser(messages$, 1000).subscribe(
  ({ messages, chatId, error }: CollectedMessages) => {
    messages && bot.sendMessage(chatId, messages.join("\n"));
    error && bot.sendMessage(chatId, error);
  }
);

import express from "express";
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  console.log("Got a ping");
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
