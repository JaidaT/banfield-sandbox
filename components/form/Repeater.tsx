'use client'

import QuestionField from './QuestionField'
import { BUTTON_SMALL, HINT, LABEL, PROBLEM } from './styles'
import type { AnswerValue, Question, RepeaterEntry } from '@/lib/form/types'

interface Props {
  question: Question
  value: RepeaterEntry[] | undefined
  onChange: (value: RepeaterEntry[]) => void
  error?: string
}

// "Add another" cards on one step (people, kids, pets). Each card shows the
// repeater's fields. One empty card shows before anything is typed.
export default function Repeater({ question, value, onChange, error }: Props) {
  const stored = value ?? []
  const cards: RepeaterEntry[] = stored.length > 0 ? stored : [{}]
  const fields = question.fields ?? []
  const atLimit = question.max !== undefined && cards.length >= question.max

  const setField = (index: number, fieldId: string, fieldValue: AnswerValue | undefined) => {
    const next = cards.map((card, i) => {
      if (i !== index) return card
      const updated = { ...card }
      if (fieldValue === undefined) delete updated[fieldId]
      else updated[fieldId] = fieldValue as RepeaterEntry[string]
      return updated
    })
    onChange(next)
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className={`${LABEL} mb-1`}>{question.prompt}</legend>
      {question.help ? <p className={HINT}>{question.help}</p> : null}

      {cards.map((card, index) => (
        <fieldset key={index} className="flex flex-col gap-3 rounded border border-neutral-400 bg-neutral-50 p-3">
          <legend className="px-1 text-sm text-neutral-600">Card {index + 1}</legend>
          {fields.map((field) => (
            <QuestionField
              key={field.id}
              question={field}
              value={card[field.id]}
              onChange={(v) => setField(index, field.id, v)}
              inputId={`q-${question.id}-${index}-${field.id}`}
            />
          ))}
          {cards.length > 1 ? (
            <button
              type="button"
              onClick={() => onChange(cards.filter((_, i) => i !== index))}
              aria-label={`Remove card ${index + 1}`}
              className={`${BUTTON_SMALL} self-start`}
            >
              Remove
            </button>
          ) : null}
        </fieldset>
      ))}

      <button
        type="button"
        onClick={() => onChange([...cards, {}])}
        disabled={atLimit}
        className={`${BUTTON_SMALL} self-start`}
      >
        {question.addLabel ?? 'Add another'}
      </button>
      {question.max !== undefined ? <p className={HINT}>Up to {question.max}.</p> : null}
      {error ? (
        <p role="alert" className={PROBLEM}>
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
