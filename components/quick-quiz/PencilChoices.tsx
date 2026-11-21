'use client'

import Image from 'next/image'
import { HINT, PROBLEM } from '@/components/form/styles'
import type { AnswerValue, Question } from '@/lib/form/types'

interface Props {
  question: Question
  value: AnswerValue | undefined
  onChange: (value: AnswerValue | undefined) => void
  error?: string
}

// Three slightly different pencil ovals, so the options don't look stamped.
// Each starts at the top left and runs a little past its start, like a
// hand-drawn loop, but with a smooth, clean line (Jaida, 2026-11-20).
const OVALS = [
  'M 46 7 C 120 1, 250 2, 290 20 C 302 34, 270 55, 150 57 C 60 58, 6 50, 6 32 C 6 14, 40 6, 92 4',
  'M 60 5 C 150 0, 266 6, 292 24 C 300 42, 250 56, 140 56 C 52 56, 4 46, 8 28 C 12 12, 54 4, 104 5',
  'M 40 9 C 110 2, 240 0, 288 18 C 304 32, 282 54, 160 58 C 70 60, 8 52, 5 34 C 3 16, 30 8, 84 6',
]

// One-choice and pick-several questions on a swatch card: plain text options
// that get circled in pencil. A faint oval on hover and keyboard focus, a full
// one (drawn in a quick stroke) and bold text when chosen. Underneath they are
// real radio buttons and tick boxes, so keyboards, screen readers and the
// answers work exactly as before. The question itself is the card's heading,
// so the group's name is for screen readers only.
export default function PencilChoices({ question, value, onChange, error }: Props) {
  const id = `q-${question.id}`
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = [question.help ? helpId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined
  const single = question.kind === 'single'
  const ticked = !single && Array.isArray(value) ? (value as string[]) : []
  // "Pick up to two": once the limit is reached, the other options turn off.
  const full = question.maxSelections !== undefined && ticked.length >= question.maxSelections

  const toggle = (optionId: string) => {
    const next = ticked.includes(optionId) ? ticked.filter((t) => t !== optionId) : [...ticked, optionId]
    onChange(next.length > 0 ? next : undefined)
  }

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={describedBy} aria-invalid={error ? true : undefined}>
      <legend className="sr-only">{question.prompt}</legend>
      {question.help ? (
        <p id={helpId} className={HINT}>
          {question.help}
        </p>
      ) : null}
      <div className="flex flex-col gap-1">
        {question.options.map((option, index) => (
          <label
            key={option.id}
            className="group relative flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-5 py-3 has-disabled:cursor-not-allowed has-disabled:opacity-40 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-navy"
          >
            <input
              type={single ? 'radio' : 'checkbox'}
              name={id}
              value={option.id}
              checked={single ? value === option.id : ticked.includes(option.id)}
              onChange={() => (single ? onChange(option.id) : toggle(option.id))}
              disabled={full && !ticked.includes(option.id)}
              className="sr-only"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 300 60"
              preserveAspectRatio="none"
              className="pencil-oval pointer-events-none absolute -inset-x-1 -inset-y-0.5 h-[calc(100%+4px)] w-[calc(100%+8px)] overflow-visible opacity-0 transition-opacity group-hover:opacity-30 group-has-focus-visible:opacity-30 group-has-checked:opacity-100 group-has-disabled:opacity-0"
            >
              <path d={OVALS[index % OVALS.length]} pathLength={1} vectorEffect="non-scaling-stroke" />
            </svg>
            {option.image ? (
              <Image src={option.image} alt="" width={120} height={90} unoptimized className="relative h-16 w-20 shrink-0 rounded-md object-cover" />
            ) : null}
            <span className="relative leading-snug group-has-checked:font-bold">{option.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} role="alert" className={PROBLEM}>
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
