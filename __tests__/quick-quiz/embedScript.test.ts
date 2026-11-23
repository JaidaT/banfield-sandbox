import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { heightMessage, newScreenMessage } from '@/lib/quick-quiz/embed'

// public/quick-quiz-embed.js: the script on the website page around the quiz's
// iframe (DECISIONS.md 2026-11-15). It is plain JavaScript for Squarespace, so
// the test reads the real file and runs it in the test browser.
const QUIZ_ORIGIN = 'https://quiz.example.com'

beforeAll(() => {
  const code = readFileSync(join(process.cwd(), 'public', 'quick-quiz-embed.js'), 'utf8')
  new Function(code)()
  // Pasting it twice must not double up.
  new Function(code)()
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// Pretends the device is used with a mouse or trackpad (true) or a finger (false).
function pointer(mouse: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: mouse && query.includes('pointer: fine'), media: query }))
}

// A page with an optional sticky header and the quiz's iframe.
function page({ headerHeight, headerOffset }: { headerHeight?: number; headerOffset?: number } = {}) {
  if (headerHeight !== undefined) {
    const header = document.createElement('header')
    header.setAttribute('data-sticky-header', '')
    vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({ height: headerHeight } as DOMRect)
    document.body.append(header)
  }
  const iframe = document.createElement('iframe')
  iframe.src = `${QUIZ_ORIGIN}/quiz`
  iframe.setAttribute('data-quick-quiz', '')
  if (headerOffset !== undefined) iframe.setAttribute('data-header-offset', String(headerOffset))
  document.body.append(iframe)
  return iframe
}

// Where the top of the quiz is on screen right now.
function quizTopAt(iframe: HTMLIFrameElement, top: number) {
  vi.spyOn(iframe, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect)
}

function receive(data: unknown, from: { source?: Window | null; origin?: string } = {}) {
  window.dispatchEvent(new MessageEvent('message', { data, source: from.source ?? null, origin: from.origin ?? QUIZ_ORIGIN }))
}
const fromQuiz = (iframe: HTMLIFrameElement) => ({ source: iframe.contentWindow, origin: QUIZ_ORIGIN })

describe('quick-quiz-embed.js: height', () => {
  test('a height message from the quiz sets the iframe height and turns off its scroll box', () => {
    const iframe = page()
    receive(heightMessage(812), fromQuiz(iframe))
    expect(iframe.style.height).toBe('812px')
    expect(iframe.getAttribute('scrolling')).toBe('no')
  })

  test('ignores a message from another window', () => {
    const iframe = page()
    receive(heightMessage(812), { source: window, origin: QUIZ_ORIGIN })
    expect(iframe.style.height).toBe('')
  })

  test('ignores a message from another web address', () => {
    const iframe = page()
    receive(heightMessage(812), { source: iframe.contentWindow, origin: 'https://other.example.com' })
    expect(iframe.style.height).toBe('')
  })

  test.each([
    ['null', null],
    ['a string', 'height 812'],
    ['another source', { source: 'someone-else', type: 'height', height: 812 }],
    ['a text height', { ...heightMessage(812), height: '812' }],
    ['a negative height', { ...heightMessage(812), height: -5 }],
  ])('does nothing with %s', (_name, data) => {
    const iframe = page()
    expect(() => receive(data, fromQuiz(iframe))).not.toThrow()
    expect(iframe.style.height).toBe('')
  })
})

describe('quick-quiz-embed.js: new screen', () => {
  test('scrolls so the quiz top sits just below the sticky header', () => {
    const iframe = page({ headerHeight: 70 })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1000)
    quizTopAt(iframe, -400)
    receive(newScreenMessage(), fromQuiz(iframe))
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 1000 - 400 - 70 }))
  })

  test('data-header-offset on the iframe sets the gap instead', () => {
    const iframe = page({ headerHeight: 70, headerOffset: 100 })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1000)
    quizTopAt(iframe, -400)
    receive(newScreenMessage(), fromQuiz(iframe))
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 1000 - 400 - 100 }))
  })

  test('with no header, scrolls the quiz top to the top of the window', () => {
    const iframe = page()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(500)
    quizTopAt(iframe, -200)
    receive(newScreenMessage(), fromQuiz(iframe))
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 300 }))
  })

  test('does not scroll when the quiz top is already in view below the header', () => {
    const iframe = page({ headerHeight: 70 })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    quizTopAt(iframe, 120)
    receive(newScreenMessage(), fromQuiz(iframe))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  test('scrolls when the quiz top is hidden under the sticky header', () => {
    const iframe = page({ headerHeight: 70 })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1000)
    quizTopAt(iframe, 30)
    receive(newScreenMessage(), fromQuiz(iframe))
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 1000 + 30 - 70 }))
  })

  // Jaida, 2026-11-22: no scrolling with a mouse or trackpad; touch screens keep it.
  test('with a mouse or trackpad, a new screen does not scroll the page', () => {
    pointer(true)
    const iframe = page({ headerHeight: 70 })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    quizTopAt(iframe, -400)
    receive(newScreenMessage(), fromQuiz(iframe))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  test('on a touch screen, a new screen still scrolls', () => {
    pointer(false)
    const iframe = page({ headerHeight: 70 })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    quizTopAt(iframe, -400)
    receive(newScreenMessage(), fromQuiz(iframe))
    expect(scrollTo).toHaveBeenCalled()
  })

  test('ignores a new-screen message from another window', () => {
    const iframe = page()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    quizTopAt(iframe, -400)
    receive(newScreenMessage(), { source: window })
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
