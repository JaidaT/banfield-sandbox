import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import ClientResultView from '@/components/quick-quiz/ClientResultView'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { buildClientResult } from '@/lib/quick-quiz/buildClientResult'
import { designDnaFor } from '@/lib/quick-quiz/designDna'
import { loadClientCopy, loadQuizData, loadQuizForm, loadSampleSubmissions } from '@/lib/quick-quiz/load'
import { loadProgressRooms } from '@/lib/quick-quiz/progressRooms'
import { quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'

// Room progress bar (docs/ROOM_PROGRESS_PLAN.md, 2026-11-21).

const quizData = loadQuizData()
const clientCopy = loadClientCopy()
const form = loadQuizForm()
const rooms = loadProgressRooms()
const questions = quizData.questions

function renderQuiz(startAt?: string) {
  render(<QuizForm questionnaire={quizQuestionnaire(questions, form)} quizData={quizData} clientCopy={clientCopy} startAt={startAt} />)
}

// The room graphics are decorative, so they are found by their file.
const roomImages = () => Array.from(document.querySelectorAll<HTMLImageElement>('[data-testid="progress-room"] img'))
const shownRoom = () => roomImages().map((img) => img.getAttribute('src'))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('room progress bar on the question screens', () => {
  test('each screen shows its own room', () => {
    for (const id of [...questions.map((q) => q.id), 'contact']) {
      renderQuiz(id)
      expect(shownRoom(), id).toEqual([rooms.screens[id].file])
      cleanup()
    }
  })

  test('the room is decoration: empty alt text, hidden from screen readers', () => {
    renderQuiz('coffee')
    expect(roomImages()[0].getAttribute('alt')).toBe('')
    expect(screen.getByTestId('progress-room').closest('[aria-hidden="true"]')).not.toBeNull()
  })

  test('no percentage shows; screen readers hear "Question N of M"', () => {
    renderQuiz('coffee')
    expect(screen.queryByText(/\d+%/)).toBeNull()
    const index = questions.findIndex((q) => q.id === 'coffee')
    expect(screen.getByText(`Question ${index + 1} of 13`)).toBeDefined()
  })

  test("the room's right edge follows the end of the fill, and starts at the far left", () => {
    renderQuiz(questions[0].id)
    expect(screen.getByTestId('progress-fill').style.width).toBe('0%')
    expect(screen.getByTestId('progress-room').style.width).toBe('0%')
    cleanup()
    renderQuiz('contact')
    // The contact screen is 12 of 13 done: about 92%.
    expect(screen.getByTestId('progress-fill').style.width).toBe('92%')
    expect(screen.getByTestId('progress-room').style.width).toBe('92%')
  })

  test('Next shows the next room; Back shows the previous one', () => {
    renderQuiz(questions[0].id)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(shownRoom()).toEqual([rooms.screens[questions[1].id].file])
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(shownRoom()).toEqual([rooms.screens[questions[0].id].file])
  })

  test('while moving, the old room fades out next to the new one, then goes', () => {
    vi.useFakeTimers()
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }))
    renderQuiz(questions[0].id)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByTestId('leaving-room').querySelector('img')!.getAttribute('src')).toBe(rooms.screens[questions[0].id].file)
    act(() => vi.advanceTimersByTime(500))
    expect(screen.queryByTestId('leaving-room')).toBeNull()
  })
})

describe('the finished home on the result', () => {
  const sample = loadSampleSubmissions()[0]
  const result = buildClientResult(sample, clientCopy, designDnaFor(sample, quizData))

  test('the 100% bar shows the finished-home rooms, hidden from screen readers', () => {
    render(<ClientResultView result={result} complete finishedHome={rooms.finishedHome} />)
    const home = screen.getByTestId('finished-home')
    expect(Array.from(home.querySelectorAll('img')).map((img) => img.getAttribute('src'))).toEqual(rooms.finishedHome.map((r) => r.file))
    expect(home.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  test('without the complete bar, no rooms', () => {
    render(<ClientResultView result={result} finishedHome={rooms.finishedHome} />)
    expect(screen.queryByTestId('finished-home')).toBeNull()
  })
})
