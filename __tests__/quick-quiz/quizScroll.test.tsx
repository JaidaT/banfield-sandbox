import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { loadClientCopy, loadQuizData, loadQuizForm } from '@/lib/quick-quiz/load'
import { quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'

// Swatch rooms (Jaida, 2026-11-22): on a short phone, each new card left the
// room scrolled out of view above the question. After each move the quiz
// scrolls its top (the room) into view, if it is above the screen.

const quizData = loadQuizData()
const questions = quizData.questions

function renderQuiz(startAt: string) {
  render(<QuizForm questionnaire={quizQuestionnaire(questions, loadQuizForm())} quizData={quizData} clientCopy={loadClientCopy()} startAt={startAt} />)
}

// Pretends the top of the quiz is this far from the top of the screen.
function quizTopAt(top: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top, bottom: top + 800, left: 0, right: 375, width: 375, height: 800, x: 0, y: top, toJSON: () => ({}) })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('scrolling after a move', () => {
  test('when the room is above the screen, the quiz scrolls its top into view', () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    renderQuiz(questions[2].id)
    quizTopAt(-150)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo.mock.calls[0][0]).toMatchObject({ top: window.scrollY - 150 })
  })

  // Jaida, 2026-11-22: no scrolling with a mouse or trackpad; touch screens keep it.
  test('with a mouse or trackpad, nothing scrolls even when the room is above the screen', () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('pointer: fine'), media: query, addEventListener() {}, removeEventListener() {} }))
    renderQuiz(questions[2].id)
    quizTopAt(-150)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  test('when the room is already in view, nothing scrolls', () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    renderQuiz(questions[2].id)
    quizTopAt(20)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  test('the cursor still moves to the new question', () => {
    vi.stubGlobal('scrollTo', vi.fn())
    renderQuiz(questions[2].id)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2 }))
  })
})
