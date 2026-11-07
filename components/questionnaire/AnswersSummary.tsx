import { BUTTON_SMALL, HINT } from './styles'
import type { QuestionnaireOutput } from '@/lib/questionnaire/output'

interface Props {
  output: QuestionnaireOutput
  // When given, each step gets an "Edit" button (the client's review screen).
  onEdit?: (stepId: string) => void
}

// The answers grouped by step, in the words people saw. Hidden questions are
// left out; skipped ones say "(skipped)". Used by the review screen and the
// team view.
export default function AnswersSummary({ output, onEdit }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {output.steps.map((step) => (
        <section key={step.id} className="flex flex-col gap-2 rounded border border-neutral-300 p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold">{step.title}</h3>
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(step.id)}
                aria-label={`Edit ${step.title}`}
                className={BUTTON_SMALL}
              >
                Edit
              </button>
            ) : null}
          </div>
          <dl className="flex flex-col gap-2">
            {step.answers
              .filter((a) => a.status !== 'hidden')
              .map((answer) => (
                <div key={answer.id}>
                  <dt className={HINT}>{answer.prompt}</dt>
                  <dd>
                    {answer.cards ? (
                      <ul className="flex flex-col gap-1">
                        {answer.cards.map((card, i) => (
                          <li key={i}>{card.map((l) => `${l.label}: ${l.value}`).join(' / ')}</li>
                        ))}
                      </ul>
                    ) : answer.status === 'skipped' ? (
                      <span className="text-neutral-500">(skipped)</span>
                    ) : (
                      answer.value
                    )}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
