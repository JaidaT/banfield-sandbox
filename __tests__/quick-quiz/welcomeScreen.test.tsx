import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { loadClientCopy, loadQuizData, loadQuizForm } from '@/lib/quick-quiz/load'
import { quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'

// The Quick Quiz's welcome card (docs/WELCOME_MASCOTS_PLAN.md, Jaida,
// 2026-11-23): a swatch-card-style card centred over moving mascot columns.

const quizData = loadQuizData()
const form = loadQuizForm()

function renderQuiz() {
  render(<QuizForm questionnaire={quizQuestionnaire(quizData.questions, form)} quizData={quizData} clientCopy={loadClientCopy()} />)
}
const card = () => within(screen.getByTestId('welcome-card'))

afterEach(cleanup)

describe('the welcome card', () => {
  test('shows the heading, the two paragraphs and "Get Started"', () => {
    renderQuiz()
    expect(card().getByRole('heading', { level: 2 }).textContent).toBe('Find your Design DNA')
    expect(card().getByText(form.welcome.intro[0])).toBeDefined()
    const time = card().getByText(/It takes about/)
    expect(time.textContent).toBe('It takes about 5 minutes, and there are no wrong answers.')
    expect(within(time).getByText('5 minutes').tagName).toBe('STRONG')
    expect(card().getByRole('button', { name: 'Get Started' })).toBeDefined()
  })

  test('the cursor starts on the heading, and "Get Started" goes to the first question', () => {
    renderQuiz()
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(quizData.questions[0].prompt)
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2 }))
  })

  test('Back from the first question returns to the welcome card', () => {
    renderQuiz()
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByTestId('welcome-card')).toBeDefined()
  })
})

describe('the footer and the iframe height', () => {
  test('no "Powered by Foyer." on the welcome card; it is back on the first question', () => {
    renderQuiz()
    expect(screen.queryByTestId('quiz-footer')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    expect(screen.getByTestId('quiz-footer')).toBeDefined()
  })

  // Jaida, 2026-11-23: the welcome screen matches the other screens' height in
  // the iframe, so the iframe rule no longer skips it.
  test('the iframe minimum height rule covers the welcome screen too', () => {
    const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')
    expect(css).toContain('[data-embedded] [data-embed-min] main {')
    expect(css).not.toContain(':not(:has([data-screen="welcome"]))')
  })
})
