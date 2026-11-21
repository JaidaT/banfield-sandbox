'use client'

import { useEffect, useId, useState } from 'react'
import type { CSSProperties } from 'react'
import ProgressBar from '@/components/form/ProgressBar'
import QuestionInput from '@/components/form/QuestionInput'
import type { StepScreenProps } from '@/components/form/StepScreen'
import { BUTTON, BUTTON_MAIN, BUTTON_ROW } from '@/components/form/styles'
import PencilChoices from '@/components/quick-quiz/PencilChoices'
import { REDUCED_FADE_MS, moveLength } from '@/components/quick-quiz/motion'

type Direction = 'forward' | 'back'

// The card on its way out while the new one comes in.
interface Leaving {
  key: number
  title: string
  direction: Direction
  // How long the move lasts in this browser (moveLength).
  length: number
}

// The card's shape: rounded, a thin light-grey border, white.
const CARD = 'overflow-hidden rounded-2xl border-2 border-[var(--line)] bg-white'

// One Quick Quiz question as a swatch card (docs/SWATCH_CARDS_PLAN.md): a
// yellow strip with the question, the answers in the swatch area below, and
// the next card peeking about 40px above. Next, Back and the peeking card move
// the stack; while a move plays, further taps are ignored.
export default function SwatchCardScreen(props: StepScreenProps) {
  const { step, answers, problems, place, progressAs, isLast, lastLabel, onAnswer, onNext, onBack, headingRef } = props
  const headingId = useId()
  const stepId = step.step.id
  const number = place?.number ?? 0

  // Which card was showing last, so a new step can start a move from it.
  // Updated while rendering (React's "storing information from previous
  // renders" pattern), so the move starts in the same paint as the new card.
  const [shown, setShown] = useState({ id: stepId, title: step.step.title, number })
  const [leaving, setLeaving] = useState<Leaving | null>(null)
  if (shown.id !== stepId) {
    const length = moveLength()
    const direction: Direction = number >= shown.number ? 'forward' : 'back'
    setLeaving(length > 0 ? { key: (leaving?.key ?? 0) + 1, title: shown.title, direction, length } : null)
    setShown({ id: stepId, title: step.step.title, number })
  }

  // The move ends after its length; then the leaving card goes.
  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => setLeaving(null), leaving.length)
    return () => clearTimeout(timer)
  }, [leaving])

  const moving = leaving !== null
  const goNext = () => {
    if (!moving) onNext()
  }
  const goBack = onBack
    ? () => {
        if (!moving) onBack()
      }
    : undefined

  // The animation names live in app/globals.css (swatch cards).
  const fade = leaving?.length === REDUCED_FADE_MS
  const enter = !leaving ? '' : fade ? 'card-fade-in' : leaving.direction === 'forward' ? 'card-in-forward' : 'card-in-back'
  const exit = !leaving ? '' : fade ? 'card-fade-out' : leaving.direction === 'forward' ? 'card-out-forward' : 'card-out-back'
  const timing = { '--move': `${leaving?.length ?? 0}ms` } as CSSProperties

  // On a one-question card the question is the heading, and its help line
  // sits in the yellow strip under it (Jaida, 2026-11-20).
  const stripQuestion =
    step.questions.length === 1 && step.questions[0].prompt === step.step.title ? step.questions[0] : undefined
  const stripHelp = stripQuestion?.help
  const helpId = `${headingId}-help`

  return (
    <>
      {place ? <ProgressBar place={place} progressAs={progressAs} /> : null}

      <div className="relative pt-10">
        {!isLast && (
          // The next card, peeking about 40px above: tapping it is Next. It sits
          // above where a leaving card ends up, so that card goes behind it.
          <button
            type="button"
            aria-label="Next question"
            onClick={goNext}
            className="absolute inset-x-4 top-0 z-[5] h-24 rounded-2xl border-2 border-[var(--line)] bg-white transition-transform hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-navy"
          />
        )}

        {leaving && (
          <div
            key={leaving.key}
            data-testid="leaving-card"
            aria-hidden="true"
            inert
            style={timing}
            className={`pointer-events-none absolute inset-x-0 top-10 bottom-0 z-30 ${CARD} ${exit}`}
          >
            <div className="bg-accent px-5 py-4 sm:px-8 sm:py-6">
              <p className="text-xl font-bold leading-snug text-charcoal">{leaving.title}</p>
            </div>
          </div>
        )}

        <section
          key={stepId}
          data-testid="active-card"
          aria-labelledby={headingId}
          aria-describedby={stripHelp ? helpId : undefined}
          style={timing}
          className={`relative z-10 ${CARD} ${enter}`}
        >
          <div data-testid="card-strip" className="flex flex-col gap-1 bg-accent px-5 py-4 sm:px-8 sm:py-6">
            <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-xl font-bold leading-snug text-charcoal outline-none">
              {step.step.title}
            </h2>
            {stripHelp ? (
              <p id={helpId} className="text-sm italic text-navy">
                {stripHelp}
              </p>
            ) : null}
          </div>
          <div className="swatch-area flex flex-col gap-5 p-5 sm:p-8">
            {step.step.intro ? <p className="leading-7">{step.step.intro}</p> : null}
            {step.questions.map((shownQuestion) => {
              // The strip already shows this question's help line.
              const question = shownQuestion === stripQuestion ? { ...shownQuestion, help: undefined } : shownQuestion
              const error = problems.find((p) => p.questionId === question.id)?.message
              const onChange = (value: Parameters<typeof onAnswer>[1]) => onAnswer(question.id, value)
              return question.kind === 'single' || question.kind === 'multi' ? (
                <PencilChoices key={question.id} question={question} value={answers[question.id]} onChange={onChange} error={error} />
              ) : (
                <QuestionInput
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={onChange}
                  error={error}
                  // The question is already the card's heading.
                  labelHidden={shownQuestion === stripQuestion}
                />
              )
            })}
          </div>
        </section>
      </div>

      <div className={BUTTON_ROW}>
        {goBack ? (
          <button type="button" onClick={goBack} className={BUTTON}>
            Back
          </button>
        ) : null}
        <button type="button" onClick={goNext} className={BUTTON_MAIN}>
          {isLast ? lastLabel : 'Next'}
        </button>
      </div>
    </>
  )
}
