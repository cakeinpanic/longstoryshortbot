export interface TelegramMessage {
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
