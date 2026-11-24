import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { loadClientCopy, loadQuizData, loadQuizForm } from '@/lib/quick-quiz/load'
import { quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'

// Jaida, 2026-11-23: "Powered by Foyer." at the bottom of every Quick Quiz
// screen: small, centred, muted, "Foyer." in bold, the last thing on the page.

const quizData = loadQuizData()

function renderQuiz(startAt?: string) {
  render(<QuizForm questionnaire={quizQuestionnaire(quizData.questions, loadQuizForm())} quizData={quizData} clientCopy={loadClientCopy()} startAt={startAt} />)
}
const footer = () => screen.getByTestId('quiz-footer')
const isLast = () => expect(screen.getByRole('main').lastElementChild).toBe(footer())

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Powered by Foyer.', () => {
  test('reads "Powered by Foyer." with Foyer. in bold', () => {
    renderQuiz('confidence')
    expect(footer().textContent).toBe('Powered by Foyer.')
    expect(footer().querySelector('strong')!.textContent).toBe('Foyer.')
  })

  // Not on the welcome card (Jaida, 2026-11-23, docs/WELCOME_MASCOTS_PLAN.md).
  test('is the last thing on a question card, and not shown on the welcome card', () => {
    renderQuiz()
    expect(screen.queryByTestId('quiz-footer')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    isLast()
  })

  test('is the last thing during Calculating and on the result', () => {
    vi.useFakeTimers()
    renderQuiz('contact')
    fireEvent.click(screen.getByRole('button', { name: 'See my results' }))
    isLast()
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByRole('heading', { name: "You're all done!" })).toBeDefined()
    isLast()
  })
})
