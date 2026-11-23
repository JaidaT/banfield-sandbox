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

// Jaida, 2026-11-22: a minimum height for the quiz inside the website's
// iframe, so the iframe does not grow and shrink with every card.
describe('embedMinHeight', () => {
  test('the real file sets a phone and a computer minimum', () => {
    expect(loadSwatchLook().embedMinHeight).toEqual({ phone: 680, computer: 960 })
  })

  test('null or left out switches it off; anything but two positive numbers is refused', () => {
    expect(parseSwatchLook({ embedMinHeight: null }).embedMinHeight).toBeNull()
    expect(parseSwatchLook({}).embedMinHeight).toBeNull()
    expect(() => parseSwatchLook({ embedMinHeight: { phone: 640 } })).toThrow(/embedMinHeight/)
    expect(() => parseSwatchLook({ embedMinHeight: { phone: -1, computer: 900 } })).toThrow(/embedMinHeight/)
  })

  test('the quiz carries the two heights for the iframe rule to use', () => {
    renderQuiz('confidence')
    const quiz = document.querySelector<HTMLElement>('[data-embed-min]')!
    expect(quiz.style.getPropertyValue('--embed-min-phone')).toBe('680px')
    expect(quiz.style.getPropertyValue('--embed-min-computer')).toBe('960px')
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
