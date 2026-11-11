'use client'

import Image from 'next/image'
import { HINT, INPUT, LABEL, PROBLEM } from './styles'
import type { AnswerValue, Question } from '@/lib/form/types'

interface Props {
  question: Question
  value: AnswerValue | undefined
  // undefined means "no answer" (a cleared number, or nothing ticked).
  onChange: (value: AnswerValue | undefined) => void
  error?: string
  // Unique id for the input. Repeater cards pass their own, e.g. "people-0-age".
  inputId?: string
}

// One question with its label, hint and problem message. Handles every kind
// except "add another" cards (Repeater) and picture picks (PickImages).
export default function QuestionField({ question, value, onChange, error, inputId }: Props) {
  const id = inputId ?? `q-${question.id}`
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = [question.help ? helpId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined
  const shared = { 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined }

  const help = question.help ? (
    <p id={helpId} className={HINT}>
      {question.help}
    </p>
  ) : null
  const problem = error ? (
    <p id={errorId} role="alert" className={PROBLEM}>
      {error}
    </p>
  ) : null

  if (question.kind === 'single' || question.kind === 'multi') {
    const ticked = question.kind === 'multi' && Array.isArray(value) ? (value as string[]) : []
    // "Pick up to two": once the limit is reached, the unticked boxes turn off.
    const full = question.maxSelections !== undefined && ticked.length >= question.maxSelections
    const toggle = (optionId: string) => {
      const next = ticked.includes(optionId) ? ticked.filter((t) => t !== optionId) : [...ticked, optionId]
      onChange(next.length > 0 ? next : undefined)
    }
    return (
      <fieldset className="flex flex-col gap-2" {...shared}>
        <legend className={`${LABEL} mb-1`}>{question.prompt}</legend>
        {help}
        <div className="flex flex-col gap-2">
          {question.options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 rounded border border-neutral-300 bg-white p-2">
              <input
                type={question.kind === 'single' ? 'radio' : 'checkbox'}
                name={id}
                value={option.id}
                checked={question.kind === 'single' ? value === option.id : ticked.includes(option.id)}
                onChange={() => (question.kind === 'single' ? onChange(option.id) : toggle(option.id))}
                disabled={full && !ticked.includes(option.id)}
                className="h-5 w-5 shrink-0"
              />
              {option.image ? (
                <Image src={option.image} alt="" width={120} height={90} unoptimized className="rounded border border-neutral-300" />
              ) : null}
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {problem}
      </fieldset>
    )
  }

  let input
  if (question.kind === 'long_text') {
    input = (
      <textarea
        id={id}
        rows={3}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
        {...shared}
      />
    )
  } else if (question.kind === 'number') {
    input = (
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={typeof value === 'number' ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className={INPUT}
        {...shared}
      />
    )
  } else {
    input = (
      <input
        id={id}
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
        {...shared}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        {question.prompt}
      </label>
      {help}
      {input}
      {problem}
    </div>
  )
}
