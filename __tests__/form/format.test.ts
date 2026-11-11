import { describe, expect, test } from 'vitest'
import { formatDate, isDate } from '@/lib/form/format'

describe('formatDate', () => {
  test('a YYYY-MM-DD date in words, the same on every computer', () => {
    expect(formatDate('2026-11-03')).toBe('Nov 3, 2026')
    expect(formatDate('2026-12-25')).toBe('Dec 25, 2026')
    expect(formatDate('2027-01-01')).toBe('Jan 1, 2027')
  })
})

describe('isDate', () => {
  test('accepts a real date written YYYY-MM-DD', () => {
    expect(isDate('2026-11-03')).toBe(true)
    expect(isDate('2028-02-29')).toBe(true)
  })

  test('refuses impossible dates, other formats and things that are not text', () => {
    for (const bad of ['2026-02-30', '2027-02-29', '2026-13-01', '2026-1-3', 'Nov 3', '', 20261103, null, undefined]) {
      expect(isDate(bad), String(bad)).toBe(false)
    }
  })
})
