import { afterEach, beforeEach, vi } from 'vitest'
import { act, cleanup } from '@testing-library/react'

// Test helpers for pretending the Quick Quiz sits in an iframe on a website
// (DECISIONS.md 2026-11-15). The test browser (jsdom) has no ResizeObserver
// and no real layout, so both are stood in for. Not a test file itself.

// Stands in for the website page's postMessage: what the quiz sent it.
export const parentPost = vi.fn()
export const sent = () => parentPost.mock.calls.map((c) => c[0])

let resizeCallbacks: (() => void)[] = []
let contentBottom = 0

// From now until the test ends, the quiz is "inside an iframe".
export function pretendIframe() {
  Object.defineProperty(window, 'parent', { value: { postMessage: parentPost }, configurable: true })
}

// Sets how tall the quiz content is, without telling anyone (for the first measure).
export function setContentBottom(bottom: number) {
  contentBottom = bottom
}

// Makes the quiz's content this tall and tells the observer it changed.
export function resizeContent(bottom: number) {
  contentBottom = bottom
  act(() => resizeCallbacks.forEach((cb) => cb()))
}

// Call once at the top of a test file that uses the helpers above.
export function setUpIframeStandIns() {
  beforeEach(() => {
    parentPost.mockClear()
    resizeCallbacks = []
    contentBottom = 0
    vi.stubGlobal(
      'ResizeObserver',
      class {
        private cb: () => void
        constructor(cb: () => void) {
          this.cb = cb
        }
        observe() {
          resizeCallbacks.push(this.cb)
        }
        disconnect() {
          resizeCallbacks = resizeCallbacks.filter((c) => c !== this.cb)
        }
      },
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ bottom: contentBottom }) as DOMRect,
    )
  })

  afterEach(() => {
    cleanup()
    Object.defineProperty(window, 'parent', { value: window, configurable: true })
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
}
