'use client'

import { useCallback, useEffect, type RefObject } from 'react'
import { heightMessage, newScreenMessage, type EmbedMessage } from '@/lib/quick-quiz/embed'

// True when the quiz is shown inside an iframe on another page.
function inIframe(): boolean {
  return typeof window !== 'undefined' && window.parent !== window
}

// Sends a message to the website page around the iframe. '*' means "whatever
// page that is": safe for now because the messages hold only a height or
// "new screen". At launch this becomes Banfield's web address (Later in the plan).
function tellPage(message: EmbedMessage) {
  window.parent.postMessage(message, '*')
}

// Connects the Quick Quiz to the website page around its iframe
// (DECISIONS.md 2026-11-15). Only inside an iframe, it:
// - sends the quiz's content height whenever it changes, so the page can size
//   the iframe to fit (no scroll box inside the page), and
// - returns notifyNewScreen, which tells the page a new screen showed, so the
//   page can scroll to the top of the quiz.
// On its own page it does nothing.
//
// It measures down to the bottom of the <main> content box inside `wrapper`,
// not the wrapper itself: the page stretches to fill the window, so measuring
// it would let the iframe grow but never shrink.
export function useEmbedBridge(wrapper: RefObject<HTMLElement | null>): () => void {
  useEffect(() => {
    const box = wrapper.current?.querySelector('main') ?? wrapper.current
    if (!inIframe() || !box) return

    let lastHeight: number | null = null
    const sendHeight = () => {
      const height = heightMessage(box.getBoundingClientRect().bottom + window.scrollY)
      if (height.type !== 'height' || height.height === lastHeight) return
      lastHeight = height.height
      tellPage(height)
    }

    sendHeight()
    const observer = new ResizeObserver(sendHeight)
    observer.observe(box)
    return () => observer.disconnect()
  }, [wrapper])

  return useCallback(() => {
    if (inIframe()) tellPage(newScreenMessage())
  }, [])
}
