import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import QuestionnaireForm from '@/components/questionnaire/QuestionnaireForm'
import { loadQuestionnaire, loadSampleHouseholds } from '@/lib/questionnaire/load'
import type { Answers } from '@/lib/questionnaire/types'

afterEach(cleanup)

const questionnaire = loadQuestionnaire()
const adult: Answers = { people: [{ name: 'Pat', age: 40 }] }

const stepHeading = () => screen.getByRole('heading', { level: 2 }).textContent
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const group = (name: string) => within(screen.getByRole('group', { name }))

describe('QuestionnaireForm', () => {
  test('starts on the welcome screen, then shows the first step with progress', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} />)
    expect(screen.getByText('Prototype - not the final design')).toBeDefined()
    expect(screen.getByText(/glass of wine/)).toBeDefined()
    click("Let's start")
    expect(stepHeading()).toBe('Contact and site')
    expect(screen.getByText('Step 1 of 10')).toBeDefined()
  })

  test('Next is blocked until contact details are filled in, with a message on each', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="contact" />)
    click('Next')
    expect(stepHeading()).toBe('Contact and site')
    expect(screen.getAllByRole('alert').map((a) => a.textContent)).toEqual([
      'Please answer "Your name"',
      'Please answer "Email"',
      'Please answer "Best phone number"',
    ])

    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Pat' } })
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    // "Email" is also a choice under "How do you like to hear from us?", so ask for the text box.
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'pat@example.com' } })
    fireEvent.change(screen.getByLabelText('Best phone number'), { target: { value: '604-555-0100' } })
    click('Next')
    expect(stepHeading()).toBe('The project')
  })

  test('Next with a required box empty puts the cursor in the first one', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="contact" />)
    screen.getByRole('button', { name: 'Next' }).focus()
    click('Next')
    expect(document.activeElement).toBe(screen.getByLabelText('Your name'))
  })

  test('for a pick-one question, the cursor goes to its first choice', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="project" />)
    click('Next')
    expect(document.activeElement).toBe(screen.getByLabelText('Furniture and styling'))
  })

  test('Next is not blocked on a step with no required questions', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="household" />)
    click('Next')
    expect(stepHeading()).toBe('Everyday life')
  })

  test('answering "Yes" to pets adds the Pets step to the progress count', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="household" initialAnswers={adult} />)
    expect(screen.getByText('Step 5 of 10')).toBeDefined()
    fireEvent.click(group('Any pets?').getByLabelText('Yes'))
    expect(screen.getByText('Step 5 of 11')).toBeDefined()
    click('Next')
    expect(stepHeading()).toBe('Pets')
  })

  test('a follow-up question appears on the same step', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="everyday" />)
    const followUp = 'Which areas or things should we focus on for storage?'
    expect(screen.queryByLabelText(followUp)).toBeNull()
    fireEvent.click(group('Is there enough storage in your home right now?').getByLabelText('No'))
    expect(screen.getByLabelText(followUp)).toBeDefined()
  })

  test('Back skips hidden steps', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="everyday" initialAnswers={{ ...adult, has_pets: 'no' }} />)
    click('Back')
    expect(stepHeading()).toBe('Household')
  })

  test('Next on the last step goes to the review screen', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="wish_list" />)
    click('Review my answers')
    expect(stepHeading()).toBe('Check your answers')
  })
})

describe('QuestionnaireForm: review and submit', () => {
  const family = loadSampleHouseholds().find((s) => s.id === 'growing_family')!.answers
  const toReview = () => {
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="wish_list" initialAnswers={family} />)
    click('Review my answers')
  }

  test('review shows the answers in words, grouped by step', () => {
    toReview()
    expect(screen.getByRole('heading', { level: 3, name: 'The project' })).toBeDefined()
    expect(screen.getByText('Renovation')).toBeDefined()
    expect(screen.getByText(/Golden retriever/)).toBeDefined()
  })

  test('"Edit" goes to that step, and "Back to review" comes straight back', () => {
    toReview()
    click('Edit The project')
    expect(stepHeading()).toBe('The project')
    click('Back to review')
    expect(stepHeading()).toBe('Check your answers')
  })

  test('submitting shows a thank-you, then the team view with a copy button', () => {
    toReview()
    click('Submit')
    expect(stepHeading()).toBe('Thank you!')
    expect(screen.getByText('Team view (demo only)')).toBeDefined()
    expect(screen.getByText('Steps skipped: none')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Copy as text' })).toBeDefined()
  })
})
