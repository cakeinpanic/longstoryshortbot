import {
  bufferToggle,
  groupBy,
  GroupedObservable,
  mergeMap,
  Observable,
  of,
  switchMap,
  throttleTime,
  timer
} from 'rxjs'

import { TelegramMessage } from './interface'

export const MET_EMPTY_MESSAGES = 'MET_EMPTY_MESSAGES' as const

export interface CollectedMessages {
  chatId: number
  messages?: string[]
  error?: typeof MET_EMPTY_MESSAGES
}

export const handleMessagesStreamByUser = (messagesStream: Observable<TelegramMessage>, timeout: number): Observable<CollectedMessages> => {
  return messagesStream.pipe(
    groupBy(({ chat }) => chat.id),
    mergeMap((messageStreamPerUser$) => {
      return groupMessagesCameTogether(messageStreamPerUser$, timeout)
    }))
}

export const groupMessagesCameTogether = (
  messagesStream: GroupedObservable<number, TelegramMessage>,
  timeout = 1000): Observable<CollectedMessages> => {
  const first = messagesStream.pipe(throttleTime(timeout))
  const chatId = messagesStream.key
  return messagesStream.pipe(
    bufferToggle(first, (i) => timer(timeout)),
    switchMap(r => {
      const messages = r.map((msg) => msg?.text || '')
      const filteredMessages = messages.filter(t => !!t)
      const hasErrors = messages.length !== filteredMessages.length
      const result: CollectedMessages = { chatId }

      if (filteredMessages.length > 0) {
        result.messages = filteredMessages
      }
      if (hasErrors) {
        result.error = MET_EMPTY_MESSAGES
      }
      return of(result)

    })
  )
}
