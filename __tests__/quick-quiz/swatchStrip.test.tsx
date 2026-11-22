import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { loadClientCopy, loadQuizData, loadQuizForm } from '@/lib/quick-quiz/load'
import { loadSwatchLook, parseSwatchLook } from '@/lib/quick-quiz/swatchLook'
import { quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'

// The swatch card's strip colour (Jaida, 2026-11-22): the brand yellow, or the
// brand navy with off-white text. Switched in data/quick-quiz/swatch-cards.json.

const quizData = loadQuizData()
const clientCopy = loadClientCopy()
const form = loadQuizForm()

function renderQuiz(startAt: string) {
  render(<QuizForm questionnaire={quizQuestionnaire(quizData.questions, form)} quizData={quizData} clientCopy={clientCopy} startAt={startAt} />)
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('swatch-cards.json', () => {
  test('the real file uses the navy strip', () => {
    expect(loadSwatchLook().strip).toBe('navy')
  })

  test('accepts "yellow" and "navy", defaults to "yellow", and refuses anything else', () => {
    expect(parseSwatchLook({ strip: 'yellow' }).strip).toBe('yellow')
    expect(parseSwatchLook({ strip: 'navy' }).strip).toBe('navy')
    expect(parseSwatchLook({}).strip).toBe('yellow')
    expect(() => parseSwatchLook({ strip: 'green' })).toThrow(/strip.*green/)
  })
})

describe('the navy strip', () => {
  test('the question card strip is navy, with off-white question and help text', () => {
    renderQuiz('confidence')
    const strip = screen.getByTestId('card-strip')
    expect(strip.dataset.strip).toBe('navy')
    expect(strip.className).toContain('bg-navy')
    expect(strip.className).not.toContain('bg-accent')
    expect(screen.getByRole('heading', { level: 2 }).className).toContain('text-frost')
    const help = quizData.questions.find((q) => q.id === 'confidence')!.help!
    expect(screen.getByText(help).className).toContain('text-frost')
  })

  test('the card falling away at the end has the navy strip too', () => {
    vi.useFakeTimers()
    renderQuiz('contact')
    fireEvent.click(screen.getByRole('button', { name: 'See my results' }))
    const falling = screen.getByTestId('falling-cards')
    expect(falling.querySelector('.bg-navy')).not.toBeNull()
    expect(falling.querySelector('.bg-accent')).toBeNull()
  })
})
