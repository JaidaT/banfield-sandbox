'use client'

import { useEffect, useRef, useState } from 'react'
import DoneScreen from './DoneScreen'
import IntroScreen from './IntroScreen'
import ReviewScreen from './ReviewScreen'
import StepScreen from './StepScreen'
import { BUTTON } from './styles'
import WireframePage from './WireframePage'
import { nextStepId, previousStepId, progress } from '@/lib/questionnaire/navigation'
import { buildOutput } from '@/lib/questionnaire/output'
import { allProblems, stepProblems } from '@/lib/questionnaire/validate'
import { visibleSteps } from '@/lib/questionnaire/visibility'
import type { Answers, AnswerValue, Questionnaire } from '@/lib/questionnaire/types'

// Screens that are not steps in the data file.
const REVIEW = 'review'
const DONE = 'done'

interface Props {
  questionnaire: Questionnaire
  // For tests and demo links: open on this step with these answers.
  startAt?: string
  initialAnswers?: Answers
}

// The whole questionnaire. This file holds the answers and decides which
// screen to show; each screen lives in its own file:
// IntroScreen (welcome), StepScreen (a step), ReviewScreen, DoneScreen.
// Answers live only here, so they are lost if the page closes (no saving yet,
// see DECISIONS.md).
export default function QuestionnaireForm({ questionnaire, startAt, initialAnswers }: Props) {
  const firstStepId = questionnaire.steps[0].id
  // The screen showing now: a step id, REVIEW or DONE.
  const [current, setCurrent] = useState(startAt ?? firstStepId)
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {})
  // Problem messages show only after Next or Submit is pressed, then update as the person types.
  const [showProblems, setShowProblems] = useState(false)
  // True after "Edit" on the review screen, to offer "Back to review".
  const [returnToReview, setReturnToReview] = useState(false)

  const hasMoved = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // After moving, put focus on the new heading. This also scrolls to the top
  // on a phone and tells screen readers the screen changed.
  useEffect(() => {
    if (hasMoved.current) headingRef.current?.focus()
  }, [current])

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
      return
    }
    goTo(target)
  }

  function next() {
    leaveTo(nextStepId(questionnaire, answers, current) ?? REVIEW)
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
    screen = <DoneScreen output={buildOutput(questionnaire, answers)} headingRef={headingRef} />
  } else if (step && step.step.questions.length === 0) {
    screen = (
      <IntroScreen
        step={step.step}
        buttonLabel={current === firstStepId ? "Let's start" : 'Next'}
        onNext={next}
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
