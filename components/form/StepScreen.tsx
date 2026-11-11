import type { Ref } from 'react'
import QuestionInput from './QuestionInput'
import { BUTTON, BUTTON_MAIN, HEADING, HINT } from './styles'
import type { Problem } from '@/lib/form/validate'
import type { VisibleStep } from '@/lib/form/visibility'
import type { Answers, AnswerValue } from '@/lib/form/types'

interface Props {
  // The step with only the questions that show for the current answers.
  step: VisibleStep
  answers: Answers
  problems: Problem[]
  // "Step 4 of 11", or null for a step that is not counted.
  place: { number: number; total: number } | null
  isLast: boolean
  // The main button on the last step, e.g. "Review my answers" or "See my results".
  lastLabel: string
  onAnswer: (questionId: string, value: AnswerValue | undefined) => void
  onNext: () => void
  // Left out when there is no step to go back to.
  onBack?: () => void
  // Only given after "Edit" on the review screen.
  onBackToReview?: () => void
  headingRef: Ref<HTMLHeadingElement>
}

// One step of the questionnaire: progress, title, its visible questions, and
// the Back / Next buttons.
export default function StepScreen(props: Props) {
  const { step, answers, problems, place, isLast, lastLabel, onAnswer, onNext, onBack, onBackToReview, headingRef } = props
  return (
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

      {step.questions.map((question) => (
        <QuestionInput
          key={question.id}
          question={question}
          value={answers[question.id]}
          onChange={(value) => onAnswer(question.id, value)}
          error={problems.find((p) => p.questionId === question.id)?.message}
        />
      ))}

      <div className="flex gap-3 border-t border-neutral-300 pt-4">
        {onBack ? (
          <button type="button" onClick={onBack} className={BUTTON}>
            Back
          </button>
        ) : null}
        <button type="button" onClick={onNext} className={BUTTON_MAIN}>
          {isLast ? lastLabel : 'Next'}
        </button>
        {onBackToReview && !isLast ? (
          <button type="button" onClick={onBackToReview} className={BUTTON}>
            Back to review
          </button>
        ) : null}
      </div>
    </>
  )
}
