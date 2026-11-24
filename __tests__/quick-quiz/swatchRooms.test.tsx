import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { loadClientCopy, loadQuizData, loadQuizForm } from '@/lib/quick-quiz/load'
import { loadRoomBuild } from '@/lib/quick-quiz/roomBuild'
import { quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'

// Swatch cards + the room that builds (docs/SWATCH_ROOMS_PLAN.md, 2026-11-22).

const quizData = loadQuizData()
const clientCopy = loadClientCopy()
const form = loadQuizForm()
const build = loadRoomBuild()
const questions = quizData.questions
const total = questions.length + 1

function renderQuiz(startAt: string) {
  render(<QuizForm questionnaire={quizQuestionnaire(questions, form)} quizData={quizData} clientCopy={clientCopy} startAt={startAt} />)
}

const room = () => screen.getByTestId('build-up-room')
const pieceImages = () => Array.from(room().querySelectorAll<HTMLImageElement>('img[data-piece]'))
const shownPieces = () => pieceImages().filter((img) => img.dataset.shown === 'true').map((img) => img.getAttribute('src'))
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

beforeEach(() => vi.stubGlobal('matchMedia', undefined))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('the room and bar on the swatch cards', () => {
  // Jaida, 2026-11-22: the room starts with the rug, and the walls and floor
  // only arrive on the result.
  test('question 1 shows the rug; question 5 five pieces; the contact card all thirteen; no walls and floor yet', () => {
    renderQuiz(questions[0].id)
    expect(room().querySelector('img[data-base]')).toBeNull()
    expect(shownPieces()).toEqual([build.pieces[0].file])
    expect(build.pieces[0].name).toBe('Rug')
    cleanup()
    renderQuiz(questions[4].id)
    expect(shownPieces()).toEqual(build.pieces.slice(0, 5).map((p) => p.file))
    cleanup()
    renderQuiz('contact')
    expect(shownPieces()).toEqual(build.pieces.map((p) => p.file))
    expect(room().querySelector('img[data-base]')).toBeNull()
  })

  test('top to bottom: the room, the bar, then the card', () => {
    renderQuiz(questions[2].id)
    const bar = screen.getByTestId('progress-fill')
    const card = screen.getByTestId('active-card')
    expect(room().compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(bar.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(bar.style.width).toBe('15%')
  })

  test('no percentage text; screen readers hear "Question N of M"; the room is hidden from them', () => {
    renderQuiz(questions[2].id)
    expect(screen.queryByText(/\d+%/)).toBeNull()
    expect(screen.getByText(`Question 3 of ${total}`)).toBeDefined()
    expect(room().closest('[aria-hidden="true"]')).not.toBeNull()
  })

  test('Next adds one piece and Back takes it away, and the room pictures stay on the page', () => {
    renderQuiz(questions[2].id)
    const before = pieceImages()
    click('Next')
    expect(shownPieces()).toHaveLength(4)
    click('Back')
    expect(shownPieces()).toHaveLength(3)
    pieceImages().forEach((img, i) => expect(img).toBe(before[i]))
  })

  test('a second tap while a card is moving does not add a second piece', () => {
    vi.useFakeTimers()
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }))
    renderQuiz(questions[2].id)
    click('Next')
    click('Next')
    expect(shownPieces()).toHaveLength(4)
  })
})

describe('the ending', () => {
  test('during "Calculating", the room and full bar stay at the top, with nothing new arriving', () => {
    vi.useFakeTimers()
    renderQuiz('contact')
    click('See my results')
    expect(screen.getByRole('status').textContent).toContain('Calculating your Design DNA')
    expect(shownPieces()).toEqual(build.pieces.map((p) => p.file))
    for (const img of pieceImages()) expect(img.className).not.toContain('piece-pop')
    expect(room().querySelector('img[data-base]')).toBeNull()
    expect(screen.getByTestId('progress-fill').style.width).toBe('100%')
    expect(room().compareDocumentPosition(screen.getByRole('status')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('the result adds the walls and floor behind the furniture, fading in, with no progress bar', () => {
    vi.useFakeTimers()
    renderQuiz('contact')
    click('See my results')
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole('heading', { name: "You're all done!" })).toBeDefined()
    expect(shownPieces()).toEqual(build.pieces.map((p) => p.file))
    for (const img of pieceImages()) expect(img.className).not.toContain('piece-pop')
    const base = room().querySelector<HTMLImageElement>('img[data-base]')!
    expect(base.getAttribute('src')).toBe(build.base)
    expect(base.className).toContain('base-arrive')
    // Behind the furniture: first in the room, so the pieces are drawn on top.
    expect(room().querySelector('img')).toBe(base)
    // Jaida, 2026-11-23: the progress bar and its "Questionnaire complete" line are gone from the result.
    expect(screen.queryByTestId('progress-fill')).toBeNull()
    expect(screen.queryByText('Questionnaire complete')).toBeNull()
    expect(room().closest('[aria-hidden="true"]')).not.toBeNull()
  })
})
