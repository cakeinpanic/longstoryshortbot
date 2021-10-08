import { TestScheduler } from 'rxjs/testing'
import { groupMessagesCameTogether } from './handleMessages'
import { TelegramMessage } from './interface'

 function getMessage(id: number, chatId: number) : TelegramMessage{
  return {
    message_id: id,
    chat: {id: chatId},
    date: new Date(),
    text: 'text' + id
  } as unknown as TelegramMessage
}

describe('simpleMap', () => {
  let rxTest: TestScheduler
  const timeout = 1000
  beforeEach(() => {
    rxTest = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })

  it('should group values correctly', () => {
    rxTest.run(({ cold, expectObservable }) => {
      const lookup = {
        a: getMessage(1, 0),
        b: getMessage(2, 0),
        c: getMessage(3, 0),
      }

      const lookup1 = { x: ['text1', 'text2', 'text3'] }
      const source = cold('  a-b-c 1s |', lookup)

      expectObservable(groupMessagesCameTogether(source, timeout)).toBe('1s x ---- |', lookup1)
    })
  })

  it('should ignore messages without text', () => {
    rxTest.run(({ cold, expectObservable }) => {
      const lookup = {
        a: getMessage(1, 0),
        b: {...getMessage(2, 0), text: undefined},
        c: getMessage(3, 0),
        d:{...getMessage(4, 0), text: undefined},
      }

      const lookup1 = { x: ['text1', 'text3'] }
      const source = cold('  a-b-c-d 1s |', lookup)

      expectObservable(groupMessagesCameTogether(source, timeout)).toBe('1s x ------ |', lookup1)
    })
  })

  it('should accept any other timeout value', () => {
    rxTest.run(({ cold, expectObservable }) => {
      const lookup = {
        a: getMessage(1, 0),
        b: getMessage(2, 0),
        c: getMessage(3, 0),
      }

      const lookup1 = { x: ['text1', 'text2', 'text3'] }
      const source = cold('  a-b-c 1s |', lookup)

      expectObservable(groupMessagesCameTogether(source, 300)).toBe('300ms x ---- 700ms |', lookup1)
    })
  })

  it('should group values into two blocks', () => {
    rxTest.run(({ cold, expectObservable }) => {
      const lookup = {
        a: getMessage(1, 0),
        b: getMessage(2, 0),
        c: getMessage(3, 0),
      }

      const lookup1 = { x: ['text1', 'text2'], y: ['text3'] }
      const source = cold('  a-b 1s c|', lookup)

      expectObservable(groupMessagesCameTogether(source, timeout)).toBe('1s x ---(y|) ', lookup1)
    })
  })

  it('should skip too long gaps in between', () => {
    rxTest.run(({ cold, expectObservable }) => {
      const lookup = {
        a: getMessage(1, 0),
        b: getMessage(2, 0),
        c: getMessage(3, 0),
      }

      const lookup1 = { x: ['text1', 'text2'], y: ['text3'] }
      const source = cold(' a-b 10s c 5s |', lookup)

      expectObservable(groupMessagesCameTogether(source, timeout)).toBe('1s x 10s --y 4s | ', lookup1)
    })
  })

  it('should skip head gap ', () => {
    rxTest.run(({ cold, expectObservable }) => {
      const lookup = {
        a: getMessage(1, 0),
        b: getMessage(2, 0),
        c: getMessage(3, 0),
      }

      const lookup1 = { x: ['text1', 'text2'], y: ['text3'] }
      const source = cold('5.5s a-b 3s c|', lookup)

      expectObservable(groupMessagesCameTogether(source, timeout)).toBe('6.5s x 2s ---(y|) ', lookup1)
    })
  })

})
