'use client'

import { useEffect, useId, useState } from 'react'
import type { CSSProperties } from 'react'
import QuestionInput from '@/components/form/QuestionInput'
import type { StepScreenProps } from '@/components/form/StepScreen'
import { BUTTON, BUTTON_MAIN } from '@/components/form/styles'
import PencilChoices from '@/components/quick-quiz/PencilChoices'
import RoomAndBar from '@/components/quick-quiz/RoomAndBar'
import { STRIP, STRIP_COLOUR } from '@/components/quick-quiz/stripStyles'
import { percentDone } from '@/lib/form/navigation'
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

// Compact on a phone so the progress bar, card and buttons fit on one screen;
// roomier on a computer (Jaida, 2026-11-20). --peek is how much of the next
// card shows; the card moves in app/globals.css use it too.

// The Back and Next row, a little closer to the card on a phone.
// card-buttons, card-strip and card-question: tightened on short screens
// (app/globals.css, "short screens").
const CARD_BUTTON_ROW = 'card-buttons mt-auto flex gap-3 pt-4 sm:pt-6 [&>button]:flex-1'

// The card's shape: rounded, a thin light-grey border, white.
const CARD = 'overflow-hidden rounded-2xl border-2 border-[var(--line)] bg-white'

// One Quick Quiz question as a swatch card (docs/SWATCH_CARDS_PLAN.md): a
// yellow strip with the question, the answers in the swatch area below, and
// the next card peeking about 40px above. Next, Back and the peeking card move
// the stack; while a move plays, further taps are ignored.
export default function SwatchCardScreen(props: StepScreenProps) {
  const { step, answers, problems, place, isLast, lastLabel, onAnswer, onNext, onBack, headingRef } = props
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
      {/* The room that builds above the bar: one piece per finished card
          (docs/SWATCH_ROOMS_PLAN.md). It stays still while the cards move. */}
      {place ? (
        // The room starts with the rug on question 1 and gains a piece per card,
        // so the contact card shows all 13 (Jaida, 2026-11-22).
        <RoomAndBar shownCount={place.number} percent={percentDone(place)} label={`Question ${place.number} of ${place.total}`} />
      ) : null}

      <div className="swatch-stack relative pt-[var(--peek)]">
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
            className={`pointer-events-none absolute inset-x-0 top-[var(--peek)] bottom-0 z-30 ${CARD} ${exit}`}
          >
            <div className={`${STRIP.strip} px-4 py-3 sm:px-8 sm:py-6`}>
              <p className={`text-lg font-bold leading-snug sm:text-xl ${STRIP.question}`}>{leaving.title}</p>
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
          <div data-testid="card-strip" data-strip={STRIP_COLOUR} className={`card-strip flex flex-col gap-1 px-4 py-3 sm:px-8 sm:py-6 ${STRIP.strip}`}>
            <h2 ref={headingRef} id={headingId} tabIndex={-1} className={`card-question text-lg font-bold leading-snug outline-none sm:text-xl ${STRIP.question}`}>
              {step.step.title}
            </h2>
            {stripHelp ? (
              <p id={helpId} className={`text-sm italic ${STRIP.help}`}>
                {stripHelp}
              </p>
            ) : null}
          </div>
          <div className="swatch-area flex flex-col gap-4 p-3 sm:gap-5 sm:p-8">
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

      <div className={CARD_BUTTON_ROW}>
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
