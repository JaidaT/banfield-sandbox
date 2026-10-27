import { describe, expect, test } from 'vitest'
import { loadSignalRules, parseSignalRules } from '@/lib/quiz/load'

const IDS = ['decisive_delegator', 'analytical_validator']

function rule(overrides: Record<string, unknown> = {}) {
  return {
    id: 'fast',
    signal: 'durationSeconds',
    op: 'lt',
    value: 150,
    weights: { decisive_delegator: 2 },
    note: 'Finished quickly',
    ...overrides,
  }
}

describe('loadSignalRules', () => {
  test('loads the signal rules from data/signals.json', () => {
    expect(loadSignalRules().length).toBeGreaterThan(0)
  })

  test('every rule has a note for the team brief', () => {
    for (const r of loadSignalRules()) expect(r.note).toBeTruthy()
  })
})

describe('parseSignalRules', () => {
  test('accepts a valid rule', () => {
    const [r] = parseSignalRules({ rules: [rule()] }, IDS)
    expect(r).toEqual(rule())
  })

  test('a rule may carry a note and no weights', () => {
    const [r] = parseSignalRules({ rules: [rule({ weights: undefined })] }, IDS)
    expect(r.weights).toEqual({})
  })

  test('throws on an unknown signal', () => {
    expect(() => parseSignalRules({ rules: [rule({ signal: 'mood' })] }, IDS)).toThrow(/fast.*mood/)
  })

  test('throws on an unknown comparison', () => {
    expect(() => parseSignalRules({ rules: [rule({ op: 'about' })] }, IDS)).toThrow(/fast.*about/)
  })

  test('throws when the threshold is not a number', () => {
    expect(() => parseSignalRules({ rules: [rule({ value: 'soon' })] }, IDS)).toThrow(/fast.*value/)
  })

  test('throws when a weight uses an unknown archetype id', () => {
    expect(() =>
      parseSignalRules({ rules: [rule({ weights: { not_real: 1 } })] }, IDS),
    ).toThrow(/fast.*not_real/)
  })

  test('throws when a rule has no note', () => {
    expect(() => parseSignalRules({ rules: [rule({ note: '' })] }, IDS)).toThrow(/fast.*note/)
  })

  test('throws on duplicate rule ids', () => {
    expect(() => parseSignalRules({ rules: [rule(), rule()] }, IDS)).toThrow(/duplicate.*fast/i)
  })
})
