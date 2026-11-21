import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import QuizPage, { metadata } from '@/app/quiz/page'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { loadClientCopy, loadQuizData, loadQuizForm } from '@/lib/quick-quiz/load'
import { CONTACT_FIELDS, quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'
import type { Answers } from '@/lib/form/types'

afterEach(cleanup)

const quizData = loadQuizData()
const clientCopy = loadClientCopy()
const form = loadQuizForm()

// The quiz as the /quiz page shows it, with contactRequired switched as needed.
function renderQuiz({ contactRequired = false, startAt, initialAnswers, allContactFields = false }: { contactRequired?: boolean; startAt?: string; initialAnswers?: Answers; allContactFields?: boolean } = {}) {
  const setting = allContactFields ? { ...form, contactRequired, contactShown: undefined, contactIntroShown: undefined } : { ...form, contactRequired }
  render(
    <QuizForm
      questionnaire={quizQuestionnaire(quizData.questions, setting)}
      quizData={quizData}
      clientCopy={clientCopy}
      startAt={startAt}
      initialAnswers={initialAnswers}
    />,
  )
}

const heading = () => screen.getByRole('heading', { level: 2 }).textContent
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const clientPart = () => within(screen.getByRole('region', { name: 'Your results' }))

describe('QuizForm', () => {
  test('starts on the welcome screen, then the first question shows its progress', () => {
    renderQuiz()
    expect(heading()).toBe(form.welcome.title)
    expect(screen.getByText(form.welcome.intro)).toBeDefined()
    click("Let's start")
    // Room progress bar (2026-11-21): no percentage text; screen readers hear "Question N of M".
    expect(screen.getByText('Question 1 of 13')).toBeDefined()
    expect(screen.queryByText('0%')).toBeNull()
    // Demo styling (2026-11-17): the question is the heading.
    expect(heading()).toBe(quizData.questions[0].prompt)
    // The long questionnaire keeps its own "Step N of M" bar.
    expect(screen.queryByText(/Step \d+ of/)).toBeNull()
    expect(screen.getByRole('group', { name: quizData.questions[0].prompt })).toBeDefined()
  })

  test('Next is not blocked on a skipped question', () => {
    renderQuiz({ startAt: 'decision_style' })
    click('Next')
    expect(screen.getByText('Question 2 of 13')).toBeDefined()
  })

  test('the contact screen is last, with "See my results" and no review screen', () => {
    renderQuiz({ startAt: 'contact' })
    expect(heading()).toBe(form.contact.title)
    expect(screen.queryByRole('button', { name: 'Review my answers' })).toBeNull()
    expect(screen.getByRole('button', { name: 'See my results' })).toBeDefined()
  })

  test('the demo contact screen asks only for name and email', () => {
    renderQuiz({ startAt: 'contact' })
    expect(screen.getAllByRole('textbox').map((box) => box.getAttribute('id'))).toEqual([`q-${CONTACT_FIELDS.name}`, `q-${CONTACT_FIELDS.email}`])
    expect(screen.getByLabelText('Your Name')).toBeDefined()
    expect(screen.getByLabelText('Email Address')).toBeDefined()
    expect(screen.queryByText(form.contact.introWhenOptional)).toBeNull()
  })

  test('contactRequired off: the result shows with the contact screen left blank', () => {
    renderQuiz({ startAt: 'contact' })
    click('See my results')
    expect(clientPart().getByRole('heading', { level: 1 }).textContent).toBe("You're all done!")
    // Nothing answered, so no Design DNA card.
    expect(clientPart().queryByText('DESIGN DNA')).toBeNull()
    expect(clientPart().queryByText('How we can help')).toBeNull()
  })

  // Demo styling (2026-11-17): the team view is hidden; the brief opens from the sample list.
  test('no team view under the result', () => {
    renderQuiz({ startAt: 'contact' })
    click('See my results')
    expect(screen.queryByRole('region', { name: 'Team view (demo only)' })).toBeNull()
    expect(screen.queryByText(/(Hot|Warm|Cold) lead/)).toBeNull()
  })

  test('contactRequired on: "See my results" is blocked until all six contact fields are filled in', () => {
    renderQuiz({ contactRequired: true, startAt: 'contact', allContactFields: true })
    expect(screen.getByText(form.contact.introWhenRequired)).toBeDefined()
    click('See my results')
    expect(heading()).toBe(form.contact.title)
    expect(screen.getAllByRole('alert')).toHaveLength(6)

    const fill = (prompt: string, value: string) => fireEvent.change(screen.getByLabelText(prompt), { target: { value } })
    fill(form.contact.name, 'Pat Example')
    fill(form.contact.email, 'pat@example.com')
    fill(form.contact.phone, '604-555-0100')
    fill(form.contact.street, '1 Sample Lane')
    fill(form.contact.city, 'Burnaby')
    fill(form.contact.postalCode, 'V5A 0A1')
    click('See my results')
    expect(clientPart().getByRole('heading', { level: 1 }).textContent).toBe("You're all done!")
  })

  test('the client result has the booking button and no client type or lead label', () => {
    const answers: Answers = {
      decision_style: 'trust_expert',
      involvement: 'show_me_the_result',
      project_scope: 'renovation',
      investment: 200000,
      [CONTACT_FIELDS.name]: 'Pat Example',
      [CONTACT_FIELDS.email]: 'pat@example.com',
    }
    renderQuiz({ startAt: 'contact', initialAnswers: answers })
    click('See my results')

    expect(clientPart().getByText('Questionnaire complete')).toBeDefined()
    expect(clientPart().getByRole('heading', { level: 2, name: 'The Visionary' })).toBeDefined()
    expect(clientPart().getByRole('heading', { level: 2, name: 'How we can help' })).toBeDefined()
    expect(clientPart().getByText('We take the lead.')).toBeDefined()
    const booking = clientPart().getByRole('link', { name: clientCopy.cta.label })
    expect(booking.getAttribute('href')).toContain('email=pat%40example.com')
    const clientText = screen.getByRole('region', { name: 'Your results' }).textContent ?? ''
    for (const archetype of quizData.archetypes) expect(clientText).not.toContain(archetype.label)
    expect(clientText).not.toMatch(/(hot|warm|cold) lead/i)
  })

  test('the cursor moves to the result greeting', () => {
    renderQuiz({ startAt: 'contact' })
    click('See my results')
    expect(document.activeElement).toBe(clientPart().getByRole('heading', { level: 1 }))
  })

  test('there is only one main area on the results screen', () => {
    renderQuiz({ startAt: 'contact' })
    click('See my results')
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })
})

describe('the /quiz page', () => {
  test('shows the welcome screen, and is kept out of search engines', () => {
    render(<QuizPage />)
    expect(heading()).toBe(form.welcome.title)
    expect(screen.getByRole('button', { name: "Let's start" })).toBeDefined()
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})

// Demo styling (2026-11-17): the "time taken", close-call and "same results as
// the sample clients" checks read the team view under the result, which is
// hidden on this branch. The same scoring is checked on the brief itself in
// teamBrief.test.ts and teamPages.test.tsx; foyer-v1 keeps these tests.
