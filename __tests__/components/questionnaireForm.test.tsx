import type { Ref } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import QuestionnairePage from '@/app/questionnaire/page'
import LongQuestionnaireForm from '@/components/questionnaire/LongQuestionnaireForm'
import QuestionnaireForm from '@/components/form/QuestionnaireForm'
import { loadQuestionnaire, loadSampleHouseholds } from '@/lib/questionnaire/load'
import { parseQuestionnaire } from '@/lib/form/parse'
import type { Answers } from '@/lib/form/types'

afterEach(cleanup)

const questionnaire = loadQuestionnaire()
const adult: Answers = { people: [{ name: 'Pat', age: 40 }] }

const stepHeading = () => screen.getByRole('heading', { level: 2 }).textContent
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const group = (name: string) => within(screen.getByRole('group', { name }))

// The shared form has no final screen of its own, so tests of the form itself
// pass this made-up one.
function StandIn({ headingRef }: { headingRef: Ref<HTMLHeadingElement> }) {
  return (
    <h2 ref={headingRef} tabIndex={-1}>
      Final screen
    </h2>
  )
}

describe('LongQuestionnaireForm: steps, checks and show/hide rules', () => {
  test('starts on the welcome screen, then shows the first step with progress', () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} />)
    expect(screen.getByText('Prototype - not the final design')).toBeDefined()
    expect(screen.getByText(/glass of wine/)).toBeDefined()
    click("Let's start")
    expect(stepHeading()).toBe('Contact and site')
    expect(screen.getByText('Step 1 of 10')).toBeDefined()
  })

  test('Next is blocked until contact details are filled in, with a message on each', () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} startAt="contact" />)
    click('Next')
    expect(stepHeading()).toBe('Contact and site')
    expect(screen.getAllByRole('alert').map((a) => a.textContent)).toEqual([
      'Please answer "Your name"',
      'Please answer "Email"',
      'Please answer "Primary phone number"',
    ])

    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Pat' } })
    expect(screen.getAllByRole('alert')).toHaveLength(2)
    // "Email" is also a choice under "How would you like to hear from us?", so ask for the text box.
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'pat@example.com' } })
    fireEvent.change(screen.getByLabelText('Primary phone number'), { target: { value: '604-555-0100' } })
    click('Next')
    expect(stepHeading()).toBe('The project')
  })

  test('Next with a required box empty puts the cursor in the first one', () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} startAt="contact" />)
    screen.getByRole('button', { name: 'Next' }).focus()
    click('Next')
    expect(document.activeElement).toBe(screen.getByLabelText('Your name'))
  })

  test('for a pick-one question, the cursor goes to its first choice', () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} startAt="project" />)
    click('Next')
    expect(document.activeElement).toBe(screen.getByLabelText('Furniture and styling'))
  })

  test('Next is not blocked on a step with no required questions', () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} startAt="household" />)
    click('Next')
    expect(stepHeading()).toBe('Everyday life')
  })

  test('answering "Yes" to pets adds the Pets step to the progress count', () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} startAt="household" initialAnswers={adult} />)
    expect(screen.getByText('Step 5 of 10')).toBeDefined()
    fireEvent.click(group('Any pets?').getByLabelText('Yes'))
    expect(screen.getByText('Step 5 of 11')).toBeDefined()
    click('Next')
    expect(stepHeading()).toBe('Pets')
  })

  test('a follow-up question appears on the same step', () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} startAt="everyday" />)
    const followUp = 'Which areas or things should we focus on for storage?'
    expect(screen.queryByLabelText(followUp)).toBeNull()
    fireEvent.click(group('Is there enough storage in your home right now?').getByLabelText('No'))
    expect(screen.getByLabelText(followUp)).toBeDefined()
  })

  test('Back skips hidden steps', () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} startAt="everyday" initialAnswers={{ ...adult, has_pets: 'no' }} />)
    click('Back')
    expect(stepHeading()).toBe('Household')
  })

  test('Next on the last step goes to the review screen', () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} startAt="wish_list" />)
    click('Review my answers')
    expect(stepHeading()).toBe('Check your answers')
  })
})

describe('LongQuestionnaireForm: review and submit', () => {
  const family = loadSampleHouseholds().find((s) => s.id === 'growing_family')!.answers
  const toReview = () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} startAt="wish_list" initialAnswers={family} />)
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
})

describe('LongQuestionnaireForm: the long questionnaire picks its own thank-you screen', () => {
  const family = loadSampleHouseholds().find((s) => s.id === 'growing_family')!.answers

  test('after Submit: the thank-you, with the cursor on it, then the team view with a copy button', () => {
    render(<LongQuestionnaireForm questionnaire={questionnaire} startAt="wish_list" initialAnswers={family} />)
    click('Review my answers')
    click('Submit')
    const thanks = screen.getByRole('heading', { level: 2, name: 'Thank you!' })
    expect(document.activeElement).toBe(thanks)
    expect(screen.getByText('Team view (demo only)')).toBeDefined()
    expect(screen.getByText('Steps skipped: none')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Copy as text' })).toBeDefined()
  })

  test('the /questionnaire page shows it, starting on the welcome screen', () => {
    render(<QuestionnairePage />)
    expect(screen.getByText(/glass of wine/)).toBeDefined()
    expect(screen.getByRole('button', { name: "Let's start" })).toBeDefined()
  })
})

describe('QuestionnaireForm: a custom final screen (doneScreen)', () => {
  const family = loadSampleHouseholds().find((s) => s.id === 'growing_family')!.answers

  // A made-up final screen, standing in for the Quick Quiz result.
  const customDone = vi.fn(({ answers, headingRef }: { answers: Answers; headingRef: Ref<HTMLHeadingElement> }) => (
    <h2 ref={headingRef} tabIndex={-1}>
      Results for {String(answers.name)}
    </h2>
  ))
  const lastAnswers = () => customDone.mock.lastCall?.[0].answers

  test('Submit shows the custom screen instead of the thank-you, and gives it the answers', () => {
    customDone.mockClear()
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="wish_list" initialAnswers={family} doneScreen={customDone} />)
    click('Review my answers')
    expect(customDone).not.toHaveBeenCalled()
    click('Submit')
    expect(stepHeading()).toBe('Results for Maya and Sam Example')
    expect(screen.queryByText('Thank you!')).toBeNull()
    expect(screen.queryByText('Team view (demo only)')).toBeNull()
    expect(lastAnswers()).toMatchObject({ name: 'Maya and Sam Example', project_type: 'renovation' })
  })

  test('the custom screen gets the answers to visible questions only', () => {
    customDone.mockClear()
    // A leftover answer to a question that is now hidden: pets were switched to "No".
    const answers = { ...family, has_pets: 'no' }
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="wish_list" initialAnswers={answers} doneScreen={customDone} />)
    click('Review my answers')
    click('Submit')
    expect(lastAnswers()).not.toHaveProperty('pets')
  })

  test('the cursor moves to the custom screen heading, like every other screen', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="wish_list" initialAnswers={family} doneScreen={customDone} />)
    click('Review my answers')
    click('Submit')
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Results for Maya and Sam Example' }))
  })
})

describe('QuestionnaireForm: no review screen (skipReview)', () => {
  const family = loadSampleHouseholds().find((s) => s.id === 'growing_family')!.answers

  test('the last step says "See my results" and goes straight to the final screen', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} startAt="wish_list" initialAnswers={family} skipReview />)
    expect(screen.queryByRole('button', { name: 'Review my answers' })).toBeNull()
    click('See my results')
    expect(stepHeading()).toBe('Final screen')
    expect(screen.queryByText('Check your answers')).toBeNull()
  })

  test('a blank required question on the last step still blocks it', () => {
    const oneStep = parseQuestionnaire({
      steps: [
        {
          id: 'contact',
          title: 'Where should Jamie reach you?',
          questions: [{ id: 'email', kind: 'short_text', prompt: 'Email', required: true }],
        },
      ],
    })
    render(<QuestionnaireForm questionnaire={oneStep} doneScreen={StandIn} skipReview />)
    click('See my results')
    expect(stepHeading()).toBe('Where should Jamie reach you?')
    expect(screen.getByRole('alert').textContent).toBe('Please answer "Email"')

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pat@example.com' } })
    click('See my results')
    expect(stepHeading()).toBe('Final screen')
  })

  test('steps before the last one still say Next', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} startAt="household" initialAnswers={family} skipReview />)
    click('Next')
    expect(stepHeading()).not.toBe('Final screen')
  })
})

describe('QuestionnaireForm: onStart', () => {
  test('is called once when "Let\'s start" is pressed, not when the page opens or on later steps', () => {
    const onStart = vi.fn()
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} onStart={onStart} />)
    expect(onStart).not.toHaveBeenCalled()
    click("Let's start")
    expect(onStart).toHaveBeenCalledTimes(1)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Pat' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'pat@example.com' } })
    fireEvent.change(screen.getByLabelText('Primary phone number'), { target: { value: '604-555-0100' } })
    click('Next')
    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
