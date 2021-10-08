import { bufferToggle, Observable, of, switchMap, throttleTime, timer } from 'rxjs'
import { TelegramMessage } from './interface'

export const MET_EMPTY_MESSAGES = 'MET_EMPTY_MESSAGES'

export const groupMessagesCameTogether = (
  messagesStream: Observable<TelegramMessage>, timeout = 1000): Observable<any> => {
  const first = messagesStream.pipe(throttleTime(timeout))
  return messagesStream.pipe(
    bufferToggle(first, (i) => timer(timeout)),
    switchMap(r => {
      const messages = r.map((msg) => msg?.text || '')
      const filteredMessages = messages.filter(t => !!t)
      if (messages.length !== filteredMessages.length) {
        if(filteredMessages.length){
          return of(filteredMessages, MET_EMPTY_MESSAGES)
        }
        return of(MET_EMPTY_MESSAGES)
      }

    }),
  )
}
