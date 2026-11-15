import { useRef } from 'react'
import { beforeEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useEmbedBridge } from '@/components/quick-quiz/useEmbedBridge'
import { heightMessage, newScreenMessage } from '@/lib/quick-quiz/embed'
import { parentPost, pretendIframe, resizeContent, sent, setContentBottom, setUpIframeStandIns } from './pretendIframe'

setUpIframeStandIns()

// A stand-in for the quiz: a wrapper around a <main> content box, like WireframePage.
function Demo() {
  const ref = useRef<HTMLDivElement>(null)
  const notifyNewScreen = useEmbedBridge(ref)
  return (
    <div ref={ref}>
      <main>
        <p>Secret answer text</p>
        <button type="button" onClick={notifyNewScreen}>
          Next
        </button>
      </main>
    </div>
  )
}

describe('useEmbedBridge in an iframe', () => {
  beforeEach(pretendIframe)

  test('sends the content height when the page opens', () => {
    setContentBottom(640)
    render(<Demo />)
    expect(sent()).toEqual([heightMessage(640)])
  })

  test('sends the new height when the content changes size, once per change', () => {
    setContentBottom(640)
    render(<Demo />)
    resizeContent(900.4)
    resizeContent(900.4)
    resizeContent(500)
    expect(sent()).toEqual([heightMessage(640), heightMessage(900), heightMessage(500)])
  })

  test('sends a new-screen message when asked', () => {
    render(<Demo />)
    parentPost.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(sent()).toEqual([newScreenMessage()])
  })

  test('never sends what is on the screen', () => {
    setContentBottom(640)
    render(<Demo />)
    resizeContent(700)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(JSON.stringify(sent())).not.toContain('Secret')
  })

  test('stops watching when the quiz closes', () => {
    render(<Demo />)
    cleanup()
    parentPost.mockClear()
    resizeContent(700)
    expect(parentPost).not.toHaveBeenCalled()
  })
})

describe('useEmbedBridge on its own page', () => {
  test('sends nothing', () => {
    setContentBottom(640)
    render(<Demo />)
    resizeContent(700)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(parentPost).not.toHaveBeenCalled()
  })
})
