'use client'

import { useEffect, useRef, useState } from 'react'
import PickImages from './PickImages'
import QuestionField from './QuestionField'
import Repeater from './Repeater'
import { nextStepId, previousStepId, progress } from '@/lib/questionnaire/navigation'
import { stepProblems } from '@/lib/questionnaire/validate'
import { visibleSteps } from '@/lib/questionnaire/visibility'
import type { Answers, AnswerValue, ImagePicks, Questionnaire, RepeaterEntry } from '@/lib/questionnaire/types'

// Screens that are not steps in the data file.
const REVIEW = 'review'

const BUTTON_CLASS = 'rounded border border-neutral-700 px-5 py-2.5 text-base font-semibold'
const PRIMARY_CLASS = `${BUTTON_CLASS} bg-neutral-800 text-white`
const SECONDARY_CLASS = `${BUTTON_CLASS} bg-white`

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
  // Seconds spent on each step. Read by the review step (added next).
  const [, setSecondsByStep] = useState<Record<string, number>>({})
  // Problem messages show only after Next is pressed, then update as the person types.
  const [showProblems, setShowProblems] = useState(false)

  const enteredAt = useRef<number | null>(null)
  const hasMoved = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // After moving, put focus on the new heading. This also scrolls to the top
  // on a phone and tells screen readers the screen changed.
  useEffect(() => {
    if (hasMoved.current) headingRef.current?.focus()
  }, [current])

  const shown = visibleSteps(questionnaire, answers)
  const step = shown.find((s) => s.step.id === current)
  const problems = showProblems ? stepProblems(questionnaire, answers, current) : []

  function goTo(target: string) {
    const now = Date.now()
    // Record time on the step being left (only steps with questions count).
    const leaving = questionnaire.steps.find((s) => s.id === current)
    if (enteredAt.current !== null && leaving && leaving.questions.length > 0) {
      const seconds = Math.round((now - enteredAt.current) / 1000)
      setSecondsByStep((prev) => ({ ...prev, [current]: (prev[current] ?? 0) + seconds }))
    }
    enteredAt.current = now
    hasMoved.current = true
    setShowProblems(false)
    setCurrent(target)
  }

  function next() {
    if (stepProblems(questionnaire, answers, current).length > 0) {
      setShowProblems(true)
      return
    }
    goTo(nextStepId(questionnaire, answers, current) ?? REVIEW)
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
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          Check your answers
        </h2>
        <div className="flex gap-3">
          <button type="button" onClick={() => goTo(lastStepId)} className={SECONDARY_CLASS}>
            Back
          </button>
        </div>
      </>
    )
  } else if (step && step.step.questions.length === 0) {
    // A step with no questions, such as the welcome.
    body = (
      <>
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          {step.step.title}
        </h2>
        {step.step.intro ? <p className="leading-7">{step.step.intro}</p> : null}
        <div>
          <button type="button" onClick={next} className={PRIMARY_CLASS}>
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
            <p className="text-sm text-neutral-600">
              Step {place.number} of {place.total}
            </p>
            <progress value={place.number} max={place.total} className="h-2 w-full" aria-hidden="true" />
          </div>
        ) : null}
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          {step.step.title}
        </h2>
        {step.step.intro ? <p className="leading-7">{step.step.intro}</p> : null}

        {step.questions.map(({ question, options }) => {
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
              options={options}
              value={value}
              onChange={(v) => setAnswer(question.id, v)}
              error={error}
            />
          )
        })}

        <div className="flex gap-3 border-t border-neutral-300 pt-4">
          {back ? (
            <button type="button" onClick={() => goTo(back)} className={SECONDARY_CLASS}>
              Back
            </button>
          ) : null}
          <button type="button" onClick={next} className={PRIMARY_CLASS}>
            {isLast ? 'Review my answers' : 'Next'}
          </button>
        </div>
      </>
    )
  } else {
    // The current step was hidden by an answer change; this should not happen
    // because Back and Next only go to visible steps.
    body = (
      <button type="button" onClick={() => goTo(firstStepId)} className={SECONDARY_CLASS}>
        Start again
      </button>
    )
  }

  return (
    <div className="flex-1 bg-white font-[system-ui] text-neutral-900">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
        <p className="rounded border border-dashed border-neutral-500 bg-neutral-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-widest text-neutral-600">
          Prototype - not the final design
        </p>
        {body}
      </main>
    </div>
  )
}
