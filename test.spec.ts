import { TestScheduler } from 'rxjs/testing'
import { handleMessagesStreamByUser, MET_EMPTY_MESSAGES } from './handleMessages'
import { TelegramMessage } from './interface'

function getMessage(id: number, chatId: number): TelegramMessage {
  return {
    message_id: id,
    chat: { id: chatId },
    date: new Date(),
    text: 'text' + id
  } as unknown as TelegramMessage
}

describe('core logic', () => {
  let rxTest: TestScheduler
  const timeout = 1000
  const chatId = 0
  const anotherChatId = 1
  beforeEach(() => {
    rxTest = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected)
    })
  })
  describe('same chatId', () => {
    it('should group values correctly', () => {
      rxTest.run(({ cold, expectObservable }) => {
        const lookup = {
          a: getMessage(1, chatId),
          b: getMessage(2, chatId),
          c: getMessage(3, chatId),
        }

        const lookup1 = { x: { messages: ['text1', 'text2', 'text3'], chatId } }
        const source = cold('  a-b-c 1s |', lookup)

        expectObservable(handleMessagesStreamByUser(source, timeout)).toBe('1s x ---- |', lookup1)
      })
    })

    it('should ignore messages without text and send error enum as next in the stream', () => {
      rxTest.run(({ cold, expectObservable }) => {
        const lookup = {
          a: getMessage(1, chatId),
          b: { ...getMessage(2, chatId), text: undefined },
          c: getMessage(3, chatId),
          d: { ...getMessage(4, chatId), text: undefined },
        }

        const lookup1 = {
          x: { messages: ['text1', 'text3'], chatId, error: MET_EMPTY_MESSAGES },
          y: { error: MET_EMPTY_MESSAGES, chatId }
        }
        const source = cold('  a-b-c 1s d 1s |', lookup)

        expectObservable(handleMessagesStreamByUser(source, timeout)).toBe('1s x 1s ---- y |', lookup1)
      })
    })

    it('should accept any other timeout value', () => {
      rxTest.run(({ cold, expectObservable }) => {
        const lookup = {
          a: getMessage(1, chatId),
          b: getMessage(2, chatId),
          c: getMessage(3, chatId),
        }

        const lookup1 = { x: { messages: ['text1', 'text2', 'text3'], chatId } }
        const source = cold('  a-b-c 1s |', lookup)

        expectObservable(handleMessagesStreamByUser(source, 300)).toBe('300ms x ---- 700ms |', lookup1)
      })
    })

    it('should group values into two blocks', () => {
      rxTest.run(({ cold, expectObservable }) => {
        const lookup = {
          a: getMessage(1, chatId),
          b: getMessage(2, chatId),
          c: getMessage(3, chatId),
        }

        const lookup1 = { x: { messages: ['text1', 'text2'], chatId }, y: { messages: ['text3'], chatId } }
        const source = cold('  a-b 1s c|', lookup)

        expectObservable(handleMessagesStreamByUser(source, timeout)).toBe('1s x ---(y|) ', lookup1)
      })
    })

    it('should skip too long gaps in between', () => {
      rxTest.run(({ cold, expectObservable }) => {
        const lookup = {
          a: getMessage(1, chatId),
          b: getMessage(2, chatId),
          c: getMessage(3, chatId),
        }

        const lookup1 = { x: { messages: ['text1', 'text2'], chatId }, y: { messages: ['text3'], chatId } }
        const source = cold(' a-b 10s c 5s |', lookup)

        expectObservable(handleMessagesStreamByUser(source, timeout)).toBe('1s x 10s --y 4s | ', lookup1)
      })
    })

    it('should work correctly with too short gaps', () => {
      rxTest.run(({ cold, expectObservable }) => {
        const lookup = {
          a: getMessage(1, chatId),
          b: getMessage(2, chatId),
          c: getMessage(3, chatId),
        }

        const lookup1 = { x: { messages: ['text1', 'text2','text3'], chatId }}
        const source = cold(' a-b 500ms c 500ms |', lookup)

        expectObservable(handleMessagesStreamByUser(source, timeout)).toBe('1s x --- | ', lookup1)
      })
    })

    it('should skip head gap ', () => {
      rxTest.run(({ cold, expectObservable }) => {
        const lookup = {
          a: getMessage(1, chatId),
          b: getMessage(2, chatId),
          c: getMessage(3, chatId),
        }

        const lookup1 = { x: { messages: ['text1', 'text2'], chatId }, y: { messages: ['text3'], chatId } }
        const source = cold('5.5s a-b 3s c|', lookup)

        expectObservable(handleMessagesStreamByUser(source, timeout)).toBe('6.5s x 2s ---(y|) ', lookup1)
      })
    })

  })

  describe('different chatId', () => {
    it('should group values correctly', () => {
      rxTest.run(({ cold, expectObservable }) => {
        const lookup = {
          a: getMessage(1, chatId),
          b: getMessage(2, anotherChatId),
          c: getMessage(3, chatId),
        }

        const lookup1 = {
          x: { messages: ['text1', 'text3'], chatId },
          y: { messages: ['text2'], chatId: anotherChatId }
        }
        const source = cold('  a-b-c 1s |', lookup)

        expectObservable(handleMessagesStreamByUser(source, timeout)).toBe('1s x-y -- |', lookup1)
      })
    })

    it('should group values respecting time ', () => {
      rxTest.run(({ cold, expectObservable }) => {
        const lookup = {
          a: getMessage(1, chatId),
          b: getMessage(2, anotherChatId),
          c: getMessage(3, chatId),
        }

        const lookup1 = {
          x: { messages: ['text1','text3'], chatId },
          y: { messages: ['text2'], chatId: anotherChatId },
        }
        const source = cold(' a-c 500ms b 1s |', lookup)
        const source2 = cold(' a-b 500ms c 1s |', lookup)

        expectObservable(handleMessagesStreamByUser(source, timeout)).toBe('1s x 500ms --y |', lookup1, 'first example failed')
        expectObservable(handleMessagesStreamByUser(source2, timeout)).toBe('1s x-y 500ms - |', lookup1, 'second example failed')
      })
    })

  })
})
