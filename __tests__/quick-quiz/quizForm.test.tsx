import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import QuizPage, { metadata } from '@/app/quiz/page'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { buildTeamBrief, shortLabel } from '@/lib/quick-quiz/buildTeamBrief'
import { loadClientCopy, loadQuizData, loadQuizForm, loadSampleSubmissions } from '@/lib/quick-quiz/load'
import { CONTACT_FIELDS, quizQuestionnaire, submissionToAnswers } from '@/lib/quick-quiz/toQuestionnaire'
import type { Answers } from '@/lib/form/types'

afterEach(cleanup)

const quizData = loadQuizData()
const clientCopy = loadClientCopy()
const form = loadQuizForm()

// The quiz as the /quiz page shows it, with contactRequired switched as needed.
function renderQuiz({ contactRequired = false, startAt, initialAnswers }: { contactRequired?: boolean; startAt?: string; initialAnswers?: Answers } = {}) {
  const setting = { ...form, contactRequired }
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
const teamPart = () => within(screen.getByRole('region', { name: 'Team view (demo only)' }))

describe('QuizForm', () => {
  test('starts on the welcome screen, then the first question is "Step 1 of 13"', () => {
    renderQuiz()
    expect(heading()).toBe(form.welcome.title)
    expect(screen.getByText(form.welcome.intro)).toBeDefined()
    click("Let's start")
    expect(screen.getByText('Step 1 of 13')).toBeDefined()
    expect(screen.getByRole('group', { name: quizData.questions[0].prompt })).toBeDefined()
  })

  test('Next is not blocked on a skipped question', () => {
    renderQuiz({ startAt: 'decision_style' })
    click('Next')
    expect(screen.getByText('Step 2 of 13')).toBeDefined()
  })

  test('the contact screen is last, with "See my results" and no review screen', () => {
    renderQuiz({ startAt: 'contact' })
    expect(heading()).toBe(form.contact.title)
    expect(screen.queryByRole('button', { name: 'Review my answers' })).toBeNull()
    expect(screen.getByRole('button', { name: 'See my results' })).toBeDefined()
  })

  test('contactRequired off: the result shows with the contact screen left blank', () => {
    renderQuiz({ startAt: 'contact' })
    expect(screen.getByText(form.contact.introWhenOptional)).toBeDefined()
    click('See my results')
    expect(clientPart().getByRole('heading', { level: 1 }).textContent).toBe("Thanks. Here's what we heard.")
    expect(teamPart().getByRole('heading', { level: 1 }).textContent).toBe('Name not given')
  })

  test('contactRequired on: "See my results" is blocked until all six contact fields are filled in', () => {
    renderQuiz({ contactRequired: true, startAt: 'contact' })
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
    expect(clientPart().getByRole('heading', { level: 1 }).textContent).toBe("Thanks, Pat. Here's what we heard.")
  })

  test('the client result has the booking button and no client type or lead label; the team brief has them', () => {
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

    const booking = clientPart().getByRole('link', { name: clientCopy.cta.label })
    expect(booking.getAttribute('href')).toContain('email=pat%40example.com')
    const clientText = screen.getByRole('region', { name: 'Your results' }).textContent ?? ''
    for (const archetype of quizData.archetypes) expect(clientText).not.toContain(archetype.label)
    expect(clientText).not.toMatch(/(hot|warm|cold) lead/i)

    const teamText = screen.getByRole('region', { name: 'Team view (demo only)' }).textContent ?? ''
    expect(teamText).toMatch(/(Hot|Warm|Cold) lead/)
    expect(teamText).toContain('Decisive Delegator')
    expect(teamPart().getByRole('button', { name: /copy/i })).toBeDefined()
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

describe('QuizForm: time taken', () => {
  afterEach(() => vi.restoreAllMocks())

  test('the clock starts when "Let\'s start" is pressed, not when the page opens', () => {
    // A pretend timer, in milliseconds, so the result is exact.
    let now = 1_000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    renderQuiz()

    now = 10_000 // spent 9 seconds reading the welcome screen
    click("Let's start")
    for (let i = 0; i < quizData.questions.length; i++) click('Next')
    now = 100_000
    click('See my results')

    // 100 - 10 = 90 seconds. Timing from when the page opened would say 1 min 39 s.
    expect(teamPart().getByText('Time to complete: 1 min 30 s')).toBeDefined()
  })

  test('opened past the welcome screen (tests and demo links), the time counts as 0', () => {
    renderQuiz({ startAt: 'contact' })
    click('See my results')
    expect(teamPart().getByText('Time to complete: 0 s')).toBeDefined()
  })
})

// Phase 4 check: the whole route (form answers -> converter -> scoring ->
// brief on screen) gives each sample client the same result as its sample
// brief. Time taken is 0 here, which only adds notes and never changes these.
describe('QuizForm: same results as the sample clients', () => {
  for (const sample of loadSampleSubmissions()) {
    test(`${sample.contact.name} gets the same lead label and client type blend`, () => {
      const expected = buildTeamBrief(sample, quizData)
      renderQuiz({ startAt: 'contact', initialAnswers: submissionToAnswers(sample) })
      click('See my results')

      expect(teamPart().getByText(expected.headline)).toBeDefined()
      expect(teamPart().getByTestId('lead-temperature').textContent).toBe(`${expected.lead.temperature} lead`)
      const blendSection = teamPart().getByRole('heading', { name: 'Client type' }).parentElement!
      const rows = within(blendSection).getAllByRole('listitem').map((row) => row.textContent)
      expect(rows).toEqual(expected.blend.scores.map((s) => `${shortLabel(s.label)}${s.percent}%`))
    })
  }
})
