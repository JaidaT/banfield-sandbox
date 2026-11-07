'use client'

import { useEffect, useRef, useState } from 'react'
import AnswersSummary from './AnswersSummary'
import PickImages from './PickImages'
import QuestionField from './QuestionField'
import QuestionnaireTeamView from './QuestionnaireTeamView'
import Repeater from './Repeater'
import { BUTTON, BUTTON_MAIN, HEADING, HINT, PROBLEM } from './styles'
import WireframePage from './WireframePage'
import { nextStepId, previousStepId, progress } from '@/lib/questionnaire/navigation'
import { buildOutput } from '@/lib/questionnaire/output'
import { allProblems, stepProblems } from '@/lib/questionnaire/validate'
import { visibleSteps } from '@/lib/questionnaire/visibility'
import type { Answers, AnswerValue, ImagePicks, Questionnaire, RepeaterEntry } from '@/lib/questionnaire/types'

// Screens that are not steps in the data file.
const REVIEW = 'review'
const DONE = 'done'

interface Props {
  questionnaire: Questionnaire
  // For tests and demo links: open on this step with these answers.
  startAt?: string
  initialAnswers?: Answers
}

// The whole questionnaire: welcome, one step per screen, then review.
// Answers live only in this component, so they are lost if the page closes
// (no saving yet, see DECISIONS.md).
export default function QuestionnaireForm({ questionnaire, startAt, initialAnswers }: Props) {
  const firstStepId = questionnaire.steps[0].id
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

  const shown = visibleSteps(questionnaire, answers)
  const step = shown.find((s) => s.step.id === current)
  const problems = !showProblems
    ? []
    : current === REVIEW
      ? allProblems(questionnaire, answers)
      : stepProblems(questionnaire, answers, current)

  function goTo(target: string) {
    hasMoved.current = true
    setShowProblems(false)
    setCurrent(target)
  }

  // Moves on only when the current step has no problems (or, on review, none at all).
  function leaveTo(target: string) {
    const found = current === REVIEW ? allProblems(questionnaire, answers) : stepProblems(questionnaire, answers, current)
    if (found.length > 0) {
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

  let body
  if (current === REVIEW) {
    const lastStepId = shown.at(-1)?.step.id ?? firstStepId
    body = (
      <>
        <h2 ref={headingRef} tabIndex={-1} className={HEADING}>
          Check your answers
        </h2>
        <p>Anything look off? Use Edit to change it. Skipped questions are fine; we will cover them together.</p>
        {problems.map((p) => (
          <p key={p.questionId} role="alert" className={PROBLEM}>
            {p.message}
          </p>
        ))}
        <AnswersSummary output={buildOutput(questionnaire, answers)} onEdit={edit} />
        <div className="flex gap-3 border-t border-neutral-300 pt-4">
          <button type="button" onClick={() => goTo(lastStepId)} className={BUTTON}>
            Back
          </button>
          <button type="button" onClick={() => leaveTo(DONE)} className={BUTTON_MAIN}>
            Submit
          </button>
        </div>
      </>
    )
  } else if (current === DONE) {
    body = (
      <>
        <h2 ref={headingRef} tabIndex={-1} className={HEADING}>
          Thank you!
        </h2>
        <p>We will read through everything before we meet. Talk soon.</p>
        <div className="mt-6 border-t-4 border-double border-neutral-400 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-600">Team view (demo only)</p>
          <QuestionnaireTeamView output={buildOutput(questionnaire, answers)} />
        </div>
      </>
    )
  } else if (step && step.step.questions.length === 0) {
    // A step with no questions, such as the welcome.
    body = (
      <>
        <h2 ref={headingRef} tabIndex={-1} className={HEADING}>
          {step.step.title}
        </h2>
        {step.step.intro ? <p className="leading-7">{step.step.intro}</p> : null}
        <div>
          <button type="button" onClick={next} className={BUTTON_MAIN}>
            {current === firstStepId ? "Let's start" : 'Next'}
          </button>
        </div>
      </>
    )
  } else if (step) {
    const place = progress(questionnaire, answers, current)
    const isLast = nextStepId(questionnaire, answers, current) === null
    const back = previousStepId(questionnaire, answers, current)
    body = (
      <>
        {place ? (
          <div className="flex flex-col gap-1">
            <p className={HINT}>
              Step {place.number} of {place.total}
            </p>
            <progress value={place.number} max={place.total} className="h-2 w-full" aria-hidden="true" />
          </div>
        ) : null}
        <h2 ref={headingRef} tabIndex={-1} className={HEADING}>
          {step.step.title}
        </h2>
        {step.step.intro ? <p className="leading-7">{step.step.intro}</p> : null}

        {step.questions.map((question) => {
          const error = problems.find((p) => p.questionId === question.id)?.message
          const value = answers[question.id]
          if (question.kind === 'repeater') {
            return (
              <Repeater
                key={question.id}
                question={question}
                value={value as RepeaterEntry[] | undefined}
                onChange={(v) => setAnswer(question.id, v)}
                error={error}
              />
            )
          }
          if (question.kind === 'pick_images') {
            return (
              <PickImages
                key={question.id}
                question={question}
                value={value as ImagePicks | undefined}
                onChange={(v) => setAnswer(question.id, v)}
                error={error}
              />
            )
          }
          return (
            <QuestionField
              key={question.id}
              question={question}
              value={value}
              onChange={(v) => setAnswer(question.id, v)}
              error={error}
            />
          )
        })}

        <div className="flex gap-3 border-t border-neutral-300 pt-4">
          {back ? (
            <button type="button" onClick={() => goTo(back)} className={BUTTON}>
              Back
            </button>
          ) : null}
          <button type="button" onClick={next} className={BUTTON_MAIN}>
            {isLast ? 'Review my answers' : 'Next'}
          </button>
          {returnToReview && !isLast ? (
            <button type="button" onClick={() => leaveTo(REVIEW)} className={BUTTON}>
              Back to review
            </button>
          ) : null}
        </div>
      </>
    )
  } else {
    // The current step was hidden by an answer change; this should not happen
    // because Back and Next only go to visible steps.
    body = (
      <button type="button" onClick={() => goTo(firstStepId)} className={BUTTON}>
        Start again
      </button>
    )
  }

  return <WireframePage banner="Prototype - not the final design">{body}</WireframePage>
}
