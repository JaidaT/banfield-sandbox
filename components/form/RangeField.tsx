'use client'

import { useId } from 'react'
import type { CSSProperties } from 'react'
import { HINT, LABEL, PROBLEM } from './styles'
import { formatRangeValue } from '@/lib/form/format'
import type { AnswerValue, Question } from '@/lib/form/types'

interface Props {
  question: Question
  // A number, the id of one of the choices (e.g. "not_sure"), or undefined.
  value: AnswerValue | undefined
  onChange: (value: AnswerValue | undefined) => void
  error?: string
  // Keep the label for screen readers only (it is already the screen heading).
  labelHidden?: boolean
}

// A slider question ("range"), with its extra choices such as "Not sure yet"
// as buttons under it. It starts with no answer until the slider is moved or
// a choice is tapped. Tapping the chosen choice again clears the answer.
export default function RangeField({ question, value, onChange, error, labelHidden }: Props) {
  const id = `q-${question.id}`
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const shownId = useId()
  const min = question.min ?? 0
  const max = question.max ?? 0

  const amount = typeof value === 'number' ? value : undefined
  const choice = question.options.find((o) => o.id === value)
  const shown = amount !== undefined ? formatRangeValue(question, amount) : choice ? choice.label : 'No answer yet'
  const describedBy = [question.help ? helpId : '', error ? errorId : '', shownId].filter(Boolean).join(' ')

  return (
    <fieldset className="flex flex-col gap-2" aria-invalid={error ? true : undefined}>
      <legend className={labelHidden ? 'sr-only' : `${LABEL} mb-1`}>{question.prompt}</legend>
      {question.help ? (
        <p id={helpId} className={HINT}>
          {question.help}
        </p>
      ) : null}
      <p id={shownId} className="text-center text-lg font-bold" aria-live="polite">
        {shown}
      </p>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={question.step}
        // A slider always has a position; with no answer yet it rests at the start.
        value={amount ?? min}
        aria-label={question.prompt}
        aria-valuetext={amount !== undefined ? shown : undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(Number(e.target.value))}
        // A tap on the slider without moving it still counts as choosing that amount.
        onClick={(e) => onChange(Number(e.currentTarget.value))}
        // Yellow up to the handle (see .form-range in globals.css).
        className="form-range"
        style={{ '--fill': `${max > min ? (((amount ?? min) - min) / (max - min)) * 100 : 0}%` } as CSSProperties}
      />
      <div className="flex justify-between text-sm font-bold text-charcoal" aria-hidden="true">
        <span>{formatRangeValue(question, min)}</span>
        <span>{formatRangeValue(question, max)}</span>
      </div>
      {question.options.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={value === option.id}
              onClick={() => onChange(value === option.id ? undefined : option.id)}
              // Demo styling (2026-11-17): a rounded pill with a radio circle.
              className="group flex items-center gap-2 rounded-xl border-2 border-[var(--line)] bg-white px-3 py-2 text-sm transition-colors hover:border-accent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-navy aria-pressed:border-accent aria-pressed:bg-accent"
            >
              <span
                aria-hidden="true"
                className="h-5 w-5 shrink-0 rounded-full border-2 border-accent bg-white group-aria-pressed:border-navy group-aria-pressed:bg-navy group-aria-pressed:shadow-[inset_0_0_0_3px_white]"
              />
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className={PROBLEM}>
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
