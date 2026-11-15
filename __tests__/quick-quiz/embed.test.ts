import { describe, expect, test } from 'vitest'
import { EMBED_SOURCE, heightMessage, newScreenMessage, readEmbedMessage } from '@/lib/quick-quiz/embed'

// The messages the quiz sends to the page around its iframe
// (DECISIONS.md 2026-11-15). They carry a height or "new screen", nothing else.
describe('embed messages', () => {
  test('heightMessage says how tall the quiz is, in whole pixels', () => {
    expect(heightMessage(812.6)).toEqual({ source: EMBED_SOURCE, type: 'height', height: 813 })
  })

  test('newScreenMessage says a new screen showed', () => {
    expect(newScreenMessage()).toEqual({ source: EMBED_SOURCE, type: 'new-screen' })
  })

  test('readEmbedMessage accepts both messages', () => {
    expect(readEmbedMessage(heightMessage(500))).toEqual(heightMessage(500))
    expect(readEmbedMessage(newScreenMessage())).toEqual(newScreenMessage())
  })

  test('readEmbedMessage keeps only the known fields', () => {
    expect(readEmbedMessage({ ...heightMessage(500), extra: 'answer text' })).toEqual(heightMessage(500))
    expect(readEmbedMessage({ ...newScreenMessage(), height: 5 })).toEqual(newScreenMessage())
  })

  test.each([
    ['null', null],
    ['a string', 'height'],
    ['a number', 500],
    ['another source', { source: 'someone-else', type: 'height', height: 500 }],
    ['an unknown type', { source: EMBED_SOURCE, type: 'resize', height: 500 }],
    ['a missing height', { source: EMBED_SOURCE, type: 'height' }],
    ['a text height', { source: EMBED_SOURCE, type: 'height', height: '500' }],
    ['a negative height', { source: EMBED_SOURCE, type: 'height', height: -1 }],
    ['an endless height', { source: EMBED_SOURCE, type: 'height', height: Infinity }],
  ])('readEmbedMessage returns null for %s', (_name, data) => {
    expect(readEmbedMessage(data)).toBeNull()
  })
})
