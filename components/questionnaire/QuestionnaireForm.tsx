'use client'

import { useEffect, useRef, useState } from 'react'
import type { ComponentType, Ref } from 'react'
import DoneScreen from './DoneScreen'
import IntroScreen from './IntroScreen'
import ReviewScreen from './ReviewScreen'
import StepScreen from './StepScreen'
import { BUTTON } from './styles'
import WireframePage from './WireframePage'
import { nextStepId, previousStepId, progress } from '@/lib/questionnaire/navigation'
import { buildOutput } from '@/lib/questionnaire/output'
import { allProblems, stepProblems } from '@/lib/questionnaire/validate'
import { visibleAnswers, visibleSteps } from '@/lib/questionnaire/visibility'
import type { Answers, AnswerValue, Questionnaire } from '@/lib/questionnaire/types'

// Screens that are not steps in the data file.
const REVIEW = 'review'
const DONE = 'done'

interface Props {
  questionnaire: Questionnaire
  // For tests and demo links: open on this step with these answers.
  startAt?: string
  initialAnswers?: Answers
  // The screen after Submit. Left out: the long questionnaire's thank-you
  // (DoneScreen). It gets the answers to visible questions only, and a
  // headingRef to put on its main heading so the cursor moves there like on
  // every other screen. The Quick Quiz uses this to show its own result.
  doneScreen?: ComponentType<DoneScreenProps>
  // Leave out the "Check your answers" screen: the last step goes straight to
  // the final screen. The Quick Quiz uses this; the long questionnaire does not.
  skipReview?: boolean
  // Called when "Let's start" on the welcome screen is pressed. The Quick Quiz
  // starts its "time taken" clock here.
  onStart?: () => void
}

export interface DoneScreenProps {
  answers: Answers
  headingRef: Ref<HTMLHeadingElement>
}

// The whole questionnaire. This file holds the answers and decides which
// screen to show; each screen lives in its own file:
// IntroScreen (welcome), StepScreen (a step), ReviewScreen, DoneScreen.
// Answers live only here, so they are lost if the page closes (no saving yet,
// see DECISIONS.md).
export default function QuestionnaireForm({ questionnaire, startAt, initialAnswers, doneScreen: CustomDone, skipReview = false, onStart }: Props) {
  const firstStepId = questionnaire.steps[0].id
  // The screen showing now: a step id, REVIEW or DONE.
  const [current, setCurrent] = useState(startAt ?? firstStepId)
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {})
  // Problem messages show only after Next or Submit is pressed, then update as the person types.
  const [showProblems, setShowProblems] = useState(false)
  // True after "Edit" on the review screen, to offer "Back to review".
  const [returnToReview, setReturnToReview] = useState(false)

  // Goes up each time Next or Submit is blocked, so the cursor can jumpt to the first problem
  const [blockedCount, setBlockedCount] = useState(0)

  const hasMoved = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // After moving, put focus on the new heading. This also scrolls to the top
  // on a phone and tells screen readers the screen changed.
  useEffect(() => {
    if (hasMoved.current) headingRef.current?.focus()
  }, [current])

  // After a blocked Next, put the cursor in the first box with a problem
  // The browsers scrolls to it, and screen readers read out its message
  useEffect(() => {
    if (blockedCount === 0) return
    const first = document.querySelector<HTMLElement>(
      'input[aria-invalid="true"], textarea[aria-invalid="true"], fieldset[aria-invalid="true"] input',
    )
    first?.focus()
  }, [blockedCount])

  function problemsHere() {
    return current === REVIEW ? allProblems(questionnaire, answers) : stepProblems(questionnaire, answers, current)
  }

  function goTo(target: string) {
    hasMoved.current = true
    setShowProblems(false)
    setCurrent(target)
  }

  // Moves on only when there are no problems on this screen.
  function leaveTo(target: string) {
    if (problemsHere().length > 0) {
      setShowProblems(true)
      setBlockedCount((n) => n + 1)
      return
    }
    goTo(target)
  }

  function next() {
    leaveTo(nextStepId(questionnaire, answers, current) ?? (skipReview ? DONE : REVIEW))
  }

  function edit(stepId: string) {
    setReturnToReview(true)
    goTo(stepId)
  }

  function setAnswer(id: string, value: AnswerValue | undefined) {
    setAnswers((prev) => {
      const updated = { ...prev }
      if (value === undefined) delete updated[id]
      else updated[id] = value
      return updated
    })
  }

  const shown = visibleSteps(questionnaire, answers)
  const step = shown.find((s) => s.step.id === current)
  const problems = showProblems ? problemsHere() : []

  let screen
  if (current === REVIEW) {
    const lastStepId = shown.at(-1)?.step.id ?? firstStepId
    screen = (
      <ReviewScreen
        output={buildOutput(questionnaire, answers)}
        problems={problems}
        onEdit={edit}
        onBack={() => goTo(lastStepId)}
        onSubmit={() => leaveTo(DONE)}
        headingRef={headingRef}
      />
    )
  } else if (current === DONE) {
    screen = CustomDone ? (
      <CustomDone answers={visibleAnswers(questionnaire, answers)} headingRef={headingRef} />
    ) : (
      <DoneScreen output={buildOutput(questionnaire, answers)} headingRef={headingRef} />
    )
  } else if (step && step.step.questions.length === 0) {
    screen = (
      <IntroScreen
        step={step.step}
        buttonLabel={current === firstStepId ? "Let's start" : 'Next'}
        onNext={() => {
          if (current === firstStepId) onStart?.()
          next()
        }}
        headingRef={headingRef}
      />
    )
  } else if (step) {
    const back = previousStepId(questionnaire, answers, current)
    screen = (
      <StepScreen
        step={step}
        answers={answers}
        problems={problems}
        place={progress(questionnaire, answers, current)}
        isLast={nextStepId(questionnaire, answers, current) === null}
        lastLabel={skipReview ? 'See my results' : 'Review my answers'}
        onAnswer={setAnswer}
        onNext={next}
        onBack={back ? () => goTo(back) : undefined}
        onBackToReview={returnToReview ? () => leaveTo(REVIEW) : undefined}
        headingRef={headingRef}
      />
    )
  } else {
    // Only if the current step became hidden, which Back and Next prevent.
    screen = (
      <button type="button" onClick={() => goTo(firstStepId)} className={BUTTON}>
        Start again
      </button>
    )
  }

  return <WireframePage banner="Prototype - not the final design">{screen}</WireframePage>
}
