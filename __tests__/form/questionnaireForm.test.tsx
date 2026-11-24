import type { Ref } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import QuestionnaireForm from '@/components/form/QuestionnaireForm'
import type { IntroScreenProps } from '@/components/form/IntroScreen'
import type { StepScreenProps } from '@/components/form/StepScreen'
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

// Swatch cards (2026-11-20): a product can bring its own screen for steps
// with questions, as it brings its own final screen.
describe('QuestionnaireForm: a custom question screen (stepScreen)', () => {
  function CustomStep({ step, onNext, headingRef }: StepScreenProps) {
    return (
      <>
        <h2 ref={headingRef} tabIndex={-1}>
          Custom: {step.step.title}
        </h2>
        <button type="button" onClick={onNext}>
          Onward
        </button>
      </>
    )
  }

  test('steps with questions use the custom screen; the welcome screen does not', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} stepScreen={CustomStep} />)
    expect(stepHeading()).not.toMatch(/^Custom/)
    click("Let's start")
    expect(stepHeading()).toBe(`Custom: ${questionnaire.steps[1].title}`)
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2 }))
  })
})

// Welcome mascots (2026-11-23): a product can bring its own welcome screen,
// and leave its footer off the welcome screen.
describe('QuestionnaireForm: a custom welcome screen (introScreen)', () => {
  function CustomWelcome({ step, buttonLabel, onNext, headingRef }: IntroScreenProps) {
    return (
      <>
        <h2 ref={headingRef} tabIndex={-1}>
          Custom welcome: {step.title}
        </h2>
        <button type="button" onClick={onNext}>
          {buttonLabel}
        </button>
      </>
    )
  }

  test('the welcome screen uses the custom screen, with the start button label and onStart', () => {
    const onStart = vi.fn()
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} introScreen={CustomWelcome} onStart={onStart} />)
    expect(stepHeading()).toBe(`Custom welcome: ${questionnaire.steps[0].title}`)
    click("Let's start")
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(stepHeading()).toBe(questionnaire.steps[1].title)
  })

  test('without it, the shared welcome screen shows as before', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} />)
    expect(stepHeading()).toBe(questionnaire.steps[0].title)
  })

  test('hideFooterOnWelcome leaves the footer off the welcome screen only', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} footer={<p>Footer text</p>} hideFooterOnWelcome />)
    expect(screen.queryByText('Footer text')).toBeNull()
    click("Let's start")
    expect(screen.getByText('Footer text')).toBeDefined()
  })
})

// Swatch rooms (2026-11-22): the Quick Quiz moves the cursor without the
// browser's own scroll, then scrolls itself so the room stays in view.
describe('QuestionnaireForm: focusWithoutScroll', () => {
  test('with it, the new heading gets the cursor without the browser scrolling to it', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} focusWithoutScroll />)
    click("Let's start")
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2 }))
    expect(focus).toHaveBeenLastCalledWith({ preventScroll: true })
    focus.mockRestore()
  })

  test('without it, the browser scrolls to the new heading as before', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} />)
    click("Let's start")
    expect(focus).toHaveBeenLastCalledWith()
    focus.mockRestore()
  })
})

// Swatch rooms (2026-11-23): a product can add a footer, last inside the
// form's main area (so the website's iframe counts it in the height).
describe('QuestionnaireForm: footer', () => {
  test('shows the footer last inside the main area, on the welcome and question screens', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} footer={<p>Footer text</p>} />)
    const main = screen.getByRole('main')
    expect(main.lastElementChild!.textContent).toBe('Footer text')
    click("Let's start")
    expect(screen.getByRole('main').lastElementChild!.textContent).toBe('Footer text')
  })

  test('no footer when none is given', () => {
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} />)
    expect(screen.queryByText('Footer text')).toBeNull()
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

// The Quick Quiz uses this to tell the website around its iframe to scroll to
// the top of the quiz (DECISIONS.md 2026-11-15).
describe('QuestionnaireForm: onScreenChange', () => {
  const family = loadSampleHouseholds().find((s) => s.id === 'growing_family')!.answers

  test('is not called when the page opens', () => {
    const onScreenChange = vi.fn()
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} onScreenChange={onScreenChange} />)
    expect(onScreenChange).not.toHaveBeenCalled()
  })

  test('is called once for each move: Next, Back, Review, Edit and Submit', () => {
    const onScreenChange = vi.fn()
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} onScreenChange={onScreenChange} />)
    click("Let's start")
    expect(onScreenChange).toHaveBeenCalledTimes(1)
    click('Back')
    expect(onScreenChange).toHaveBeenCalledTimes(2)
    cleanup()

    onScreenChange.mockClear()
    render(<QuestionnaireForm questionnaire={questionnaire} startAt="wish_list" initialAnswers={family} doneScreen={StandIn} onScreenChange={onScreenChange} />)
    click('Review my answers')
    expect(onScreenChange).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getAllByRole('button', { name: /^Edit/ })[0])
    expect(onScreenChange).toHaveBeenCalledTimes(2)
    click('Back to review')
    expect(onScreenChange).toHaveBeenCalledTimes(3)
    click('Submit')
    expect(onScreenChange).toHaveBeenCalledTimes(4)
    expect(stepHeading()).toBe('Final screen')
  })

  test('is not called when Next is blocked by a problem', () => {
    const onScreenChange = vi.fn()
    render(<QuestionnaireForm questionnaire={questionnaire} doneScreen={StandIn} startAt="contact" onScreenChange={onScreenChange} />)
    click('Next')
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    expect(onScreenChange).not.toHaveBeenCalled()
  })
})
