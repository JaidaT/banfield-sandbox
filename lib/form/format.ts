import type { Question } from './types'

// A slider number in words. Money: 200000 -> "$200K", and the top of the
// slider gets a "+" because it means "this much or more" (500000 -> "$500K+").
// Without a format, the plain number.
export function formatRangeValue(question: Question, value: number): string {
  if (question.format !== 'money') return String(value)
  const text = value >= 1000 ? `$${value / 1000}K` : `$${value}`
  return value === question.max ? `${text}+` : text
}
