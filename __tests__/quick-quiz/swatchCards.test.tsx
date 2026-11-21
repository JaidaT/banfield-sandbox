import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { loadClientCopy, loadQuizData, loadQuizForm } from '@/lib/quick-quiz/load'
import { CONTACT_FIELDS, quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'
import type { Answers } from '@/lib/form/types'

// Swatch cards (docs/SWATCH_CARDS_PLAN.md, 2026-11-20): each question is a card
// in a stack, with the next card peeking above it.

const quizData = loadQuizData()
const clientCopy = loadClientCopy()
const form = loadQuizForm()
const questions = quizData.questions
const prompt = (id: string) => questions.find((q) => q.id === id)!.prompt

function renderQuiz({ startAt, initialAnswers, contactRequired = false }: { startAt?: string; initialAnswers?: Answers; contactRequired?: boolean } = {}) {
  render(
    <QuizForm
      questionnaire={quizQuestionnaire(questions, { ...form, contactRequired })}
      quizData={quizData}
      clientCopy={clientCopy}
      startAt={startAt}
      initialAnswers={initialAnswers}
    />,
  )
}

const heading = () => screen.getByRole('heading', { level: 2 }).textContent
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const activeCard = () => screen.getByTestId('active-card')

// A pretend browser setting for motion. jsdom has no matchMedia, which the
// cards treat as "no motion" so moves finish straight away.
function setMotion(reduce: boolean | null) {
  if (reduce === null) {
    vi.stubGlobal('matchMedia', undefined)
    return
  }
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }))
}

beforeEach(() => setMotion(null))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('swatch cards: the card and the stack', () => {
  test('the welcome screen is not a card; the first question is', () => {
    renderQuiz()
    expect(screen.queryByTestId('active-card')).toBeNull()
    click("Let's start")
    expect(within(activeCard()).getByRole('heading', { level: 2 }).textContent).toBe(questions[0].prompt)
  })

  test('the progress percentage sits above the card', () => {
    renderQuiz({ startAt: questions[0].id })
    const percent = screen.getByText('0%')
    expect(percent.compareDocumentPosition(activeCard()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('the next card peeks above: pressing it moves to the next question', () => {
    renderQuiz({ startAt: questions[0].id })
    click('Next question')
    expect(heading()).toBe(questions[1].prompt)
  })

  // Jaida, 2026-11-20: the help line sits in the yellow strip, under the question.
  test('the help line is in the yellow strip, once, and the answers are described by it', () => {
    for (const id of ['confidence', 'home_meaning', 'investment']) {
      renderQuiz({ startAt: id })
      const help = questions.find((q) => q.id === id)!.help!
      expect(screen.getAllByText(help), id).toHaveLength(1)
      expect(screen.getByTestId('card-strip').textContent, id).toContain(help)
      expect(activeCard().getAttribute('aria-describedby'), id).toBe(screen.getByText(help).id)
      cleanup()
    }
  })

  test('the contact card is last, with no card peeking behind it, and says "See my results"', () => {
    renderQuiz({ startAt: 'contact' })
    expect(within(activeCard()).getByRole('heading', { level: 2 }).textContent).toBe(form.contact.title)
    expect(screen.queryByRole('button', { name: 'Next question' })).toBeNull()
    expect(screen.getByRole('button', { name: 'See my results' })).toBeDefined()
  })

  test('Back moves to the previous card; Back on the first card returns to the welcome screen', () => {
    renderQuiz({ startAt: questions[1].id })
    click('Back')
    expect(heading()).toBe(questions[0].prompt)
    click('Back')
    expect(heading()).toBe(form.welcome.title)
    expect(screen.queryByTestId('active-card')).toBeNull()
  })

  test('after a move, the cursor is on the new question', () => {
    renderQuiz({ startAt: questions[0].id })
    click('Next')
    expect(document.activeElement).toBe(within(activeCard()).getByRole('heading', { level: 2 }))
  })
})

describe('swatch cards: one move at a time', () => {
  test('a second tap while the cards are moving does nothing', () => {
    vi.useFakeTimers()
    setMotion(false)
    renderQuiz({ startAt: questions[0].id })
    click('Next')
    click('Next')
    click('Next question')
    expect(heading()).toBe(questions[1].prompt)

    act(() => vi.advanceTimersByTime(500))
    click('Next')
    expect(heading()).toBe(questions[2].prompt)
  })

  test('while moving, the outgoing card is shown but hidden from screen readers', () => {
    vi.useFakeTimers()
    setMotion(false)
    renderQuiz({ startAt: questions[0].id })
    click('Next')
    const ghost = screen.getByTestId('leaving-card')
    expect(ghost.getAttribute('aria-hidden')).toBe('true')
    act(() => vi.advanceTimersByTime(500))
    expect(screen.queryByTestId('leaving-card')).toBeNull()
  })

  test('with reduced motion, moves still work', () => {
    vi.useFakeTimers()
    setMotion(true)
    renderQuiz({ startAt: questions[0].id })
    click('Next')
    act(() => vi.advanceTimersByTime(200))
    click('Next')
    expect(heading()).toBe(questions[2].prompt)
  })
})

describe('swatch cards: choosing with the pencil circle', () => {
  test('one choice: the options are real radio buttons, and choosing one records it', () => {
    renderQuiz({ startAt: 'decision_style' })
    const options = questions.find((q) => q.id === 'decision_style')!.options
    const radio = screen.getByRole('radio', { name: options[1].label }) as HTMLInputElement
    fireEvent.click(radio)
    expect(radio.checked).toBe(true)
    expect(screen.getByRole('group', { name: prompt('decision_style') })).toBeDefined()
    // Each option has its pencil oval drawn, hidden from screen readers.
    expect(radio.closest('label')!.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })

  test('pick up to two: a third choice is turned off until one is un-circled', () => {
    renderQuiz({ startAt: 'confidence' })
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    fireEvent.click(boxes[0])
    fireEvent.click(boxes[1])
    expect(boxes[2].disabled).toBe(true)
    fireEvent.click(boxes[0])
    expect(boxes[2].disabled).toBe(false)
  })
})

describe('swatch cards: the ending', () => {
  test('"See my results" shows "Calculating your Design DNA" for 2 seconds, then the result', () => {
    vi.useFakeTimers()
    renderQuiz({ startAt: 'contact', initialAnswers: { decision_style: 'trust_expert', [CONTACT_FIELDS.name]: 'Pat' } })
    click('See my results')
    expect(screen.getByRole('status').textContent).toContain('Calculating your Design DNA')
    expect(screen.queryByRole('heading', { name: "You're all done!" })).toBeNull()

    act(() => vi.advanceTimersByTime(1900))
    expect(screen.queryByRole('heading', { name: "You're all done!" })).toBeNull()
    act(() => vi.advanceTimersByTime(100))
    const done = screen.getByRole('heading', { name: "You're all done!" })
    expect(document.activeElement).toBe(done)
    expect(screen.queryByText(/Calculating your Design DNA/)).toBeNull()
  })

  test('the cards fall away behind the calculating screen, hidden from screen readers', () => {
    vi.useFakeTimers()
    renderQuiz({ startAt: 'contact' })
    click('See my results')
    expect(screen.getByTestId('falling-cards').getAttribute('aria-hidden')).toBe('true')
  })

  test('a blocked "See my results" shows the problems on the card, and no calculating screen', () => {
    renderQuiz({ startAt: 'contact', contactRequired: true })
    click('See my results')
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    expect(screen.queryByRole('status')).toBeNull()
    expect(heading()).toBe(form.contact.title)
  })
})
