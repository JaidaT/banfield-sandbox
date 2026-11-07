'use client'

import QuestionField from './QuestionField'
import type { AnswerValue, Question, RepeaterEntry } from '@/lib/questionnaire/types'

interface Props {
  question: Question
  value: RepeaterEntry[] | undefined
  onChange: (value: RepeaterEntry[]) => void
  error?: string
}

const BUTTON_CLASS = 'rounded border border-neutral-500 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40'

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
      <legend className="mb-1 text-sm font-semibold">{question.prompt}</legend>
      {question.help ? <p className="text-sm text-neutral-600">{question.help}</p> : null}

      {cards.map((card, index) => (
        <fieldset key={index} className="flex flex-col gap-3 rounded border border-neutral-400 bg-neutral-50 p-3">
          <legend className="px-1 text-sm text-neutral-600">Card {index + 1}</legend>
          {fields.map((field) => (
            <QuestionField
              key={field.id}
              question={field}
              options={field.options}
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
              className={`${BUTTON_CLASS} self-start`}
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
        className={`${BUTTON_CLASS} self-start`}
      >
        {question.addLabel ?? 'Add another'}
      </button>
      {question.max !== undefined ? <p className="text-sm text-neutral-600">Up to {question.max}.</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
