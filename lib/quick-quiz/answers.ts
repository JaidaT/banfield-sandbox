import type { Answer, Question } from './types'

// Slider amounts as money: 200000 -> "$200K", and the top of the slider gets a
// "+" because it means "this much or more" (500000 -> "$500K+").
export function formatAmount(value: number, max?: number): string {
  const text = value >= 1000 ? `$${value / 1000}K` : `$${value}`
  return value === max ? `${text}+` : text
}

// Turns any answer into readable text: option labels for choice questions, the
// trimmed text for text questions, and money for sliders. Empty when skipped.
export function answerLabels(question: Question, answer: Answer | undefined): string[] {
  if (answer === undefined) return []
  if (question.kind === 'text') {
    return typeof answer === 'string' && answer.trim() !== '' ? [answer.trim()] : []
  }
  if (typeof answer === 'number') return [formatAmount(answer, question.max)]
  const chosen = Array.isArray(answer) ? answer : [answer]
  return question.options.filter((o) => chosen.includes(o.id)).map((o) => o.label)
}
