import type { Ref } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import QuestionnaireForm from '@/components/form/QuestionnaireForm'
import { parseQuestionnaire } from '@/lib/form/parse'
import type { Answers } from '@/lib/form/types'
// The long questionnaire's file is a handy, realistic example to test the form with.
import { loadQuestionnaire, loadSampleHouseholds } from '@/lib/long-questionnaire/load'

afterEach(cleanup)

const questionnaire = loadQuestionnaire()

const stepHeading = () => screen.getByRole('heading', { level: 2 }).textContent
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

// The shared form has no final screen of its own, so tests of the form itself
// pass this made-up one.
function StandIn({ headingRef }: { headingRef: Ref<HTMLHeadingElement> }) {
  return (
    <h2 ref={headingRef} tabIndex={-1}>
      Final screen
    </h2>
  )
}

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
