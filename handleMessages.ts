import { bufferToggle, map, Observable, throttleTime, timer } from 'rxjs'
import { TelegramMessage } from './interface'

export const groupMessagesCameTogether = (messagesStream: Observable<TelegramMessage>, timeout = 1000): Observable<any> => {
  const first = messagesStream.pipe(throttleTime(timeout))
  return messagesStream.pipe(
    bufferToggle(first, (i) => timer(timeout)),
    map(r => r.map(({ text }) => text)))
}
