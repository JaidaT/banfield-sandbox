import type { Ref } from 'react'
import AnswersSummary from './AnswersSummary'
import { BUTTON, BUTTON_MAIN, HEADING, PROBLEM } from './styles'
import type { QuestionnaireOutput } from '@/lib/questionnaire/output'
import type { Problem } from '@/lib/questionnaire/validate'

interface Props {
  output: QuestionnaireOutput
  problems: Problem[]
  onEdit: (stepId: string) => void
  onBack: () => void
  onSubmit: () => void
  headingRef: Ref<HTMLHeadingElement>
}

// "Check your answers": every answer grouped by step, with an Edit button for
// each step, then Submit.
export default function ReviewScreen({ output, problems, onEdit, onBack, onSubmit, headingRef }: Props) {
  return (
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
      <AnswersSummary output={output} onEdit={onEdit} />
      <div className="flex gap-3 border-t border-neutral-300 pt-4">
        <button type="button" onClick={onBack} className={BUTTON}>
          Back
        </button>
        <button type="button" onClick={onSubmit} className={BUTTON_MAIN}>
          Submit
        </button>
      </div>
    </>
  )
}
