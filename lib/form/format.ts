import type { Question } from './types'

// A slider number in words. Money: 200000 -> "$200K", and the top of the
// slider gets a "+" because it means "this much or more" (500000 -> "$500K+").
// Without a format, the plain number.
export function formatRangeValue(question: Question, value: number): string {
  if (question.format !== 'money') return String(value)
  const text = value >= 1000 ? `$${value / 1000}K` : `$${value}`
  return value === question.max ? `${text}+` : text
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function daysIn(year: number, month: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
}

// True for a real date written YYYY-MM-DD, such as "2026-11-03".
export function isDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  return month >= 1 && month <= 12 && day >= 1 && day <= daysIn(year, month)
}

// "2026-11-03" -> "Nov 3, 2026". Worked out from the text itself, not the
// computer's clock or language, so it reads the same everywhere.
export function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}
