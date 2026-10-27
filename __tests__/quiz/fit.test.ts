import { describe, expect, test } from 'vitest'
import { loadFitRules, loadQuestions, parseFitRules } from '@/lib/quiz/load'
import type { Question } from '@/lib/quiz/types'

const QUESTIONS: Question[] = [
  {
    id: 'timeframe',
    kind: 'single',
    prompt: 'When?',
    optional: false,
    criterion: 'timeframe',
    options: [
      { id: 'soon', label: 'Soon', weights: {} },
      { id: 'later', label: 'Later', weights: {} },
    ],
  },
  {
    id: 'coffee',
    kind: 'single',
    prompt: 'Coffee?',
    optional: false,
    options: [{ id: 'black', label: 'Black', weights: { decisive_delegator: 1 } }],
  },
]

function rules(overrides: Record<string, unknown> = {}) {
  return {
    criteria: {
      timeframe: { label: 'Timeframe', ratings: { soon: 'strong', later: 'weak' } },
    },
    serviceAreas: ['Burnaby'],
    redFlags: [
      { id: 'late', note: 'Starting late', when: [{ question: 'timeframe', option: 'later' }] },
    ],
    ...overrides,
  }
}

describe('loadFitRules', () => {
  test('loads the fit rules from data/fit.json', () => {
    expect(Object.keys(loadFitRules().criteria).length).toBeGreaterThan(0)
  })

  test('every fit question in the bank has a rating for every answer', () => {
    const { criteria } = loadFitRules()
    for (const q of loadQuestions().filter((q) => q.criterion)) {
      const criterion = criteria[q.criterion as string]
      expect(criterion, `no fit ratings for ${q.criterion}`).toBeDefined()
      for (const o of q.options) {
        expect(criterion.ratings[o.id], `${q.id} option ${o.id} has no rating`).toBeDefined()
      }
    }
  })

  test('has at least one service area', () => {
    expect(loadFitRules().serviceAreas.length).toBeGreaterThan(0)
  })

  // Brand Standards: studio is in Port Moody and serves Vancouver and the Lower Mainland.
  test('service area covers the home base and the wider Lower Mainland', () => {
    const areas = loadFitRules().serviceAreas
    for (const city of ['Port Moody', 'Vancouver', 'Surrey', 'Langley', 'Abbotsford']) {
      expect(areas).toContain(city)
    }
  })

  // Brand Standards: a one-time session is Banfield's paid "Designer on Call" service,
  // so choosing it is never a weak fit on its own.
  test('the one-time session answer is not rated weak', () => {
    expect(loadFitRules().criteria.service.ratings.consult).not.toBe('weak')
  })
})

describe('parseFitRules', () => {
  test('accepts valid rules', () => {
    const fit = parseFitRules(rules(), QUESTIONS)
    expect(fit.criteria.timeframe.ratings).toEqual({ soon: 'strong', later: 'weak' })
    expect(fit.criteria.timeframe.questionId).toBe('timeframe')
    expect(fit.redFlags[0].when).toEqual([{ question: 'timeframe', option: 'later' }])
  })

  test('throws when a fit question has no criterion entry', () => {
    expect(() => parseFitRules(rules({ criteria: {} }), QUESTIONS)).toThrow(/timeframe/)
  })

  test('throws when a criterion has no matching question', () => {
    const criteria = {
      timeframe: { label: 'Timeframe', ratings: { soon: 'strong', later: 'weak' } },
      budget: { label: 'Budget', ratings: {} },
    }
    expect(() => parseFitRules(rules({ criteria }), QUESTIONS)).toThrow(/budget/)
  })

  test('throws when an answer has no rating', () => {
    const criteria = { timeframe: { label: 'Timeframe', ratings: { soon: 'strong' } } }
    expect(() => parseFitRules(rules({ criteria }), QUESTIONS)).toThrow(/timeframe.*later/)
  })

  test('throws when a rating names an answer that does not exist', () => {
    const criteria = {
      timeframe: { label: 'Timeframe', ratings: { soon: 'strong', later: 'weak', never: 'weak' } },
    }
    expect(() => parseFitRules(rules({ criteria }), QUESTIONS)).toThrow(/timeframe.*never/)
  })

  test('throws on a rating that is not strong, possible or weak', () => {
    const criteria = { timeframe: { label: 'Timeframe', ratings: { soon: 'stong', later: 'weak' } } }
    expect(() => parseFitRules(rules({ criteria }), QUESTIONS)).toThrow(/soon.*stong/)
  })

  test('throws when service areas are missing or empty', () => {
    expect(() => parseFitRules(rules({ serviceAreas: [] }), QUESTIONS)).toThrow(/service area/i)
  })

  test('throws when a red flag points at an unknown question or answer', () => {
    const badQuestion = [{ id: 'x', note: 'X', when: [{ question: 'nope', option: 'soon' }] }]
    const badOption = [{ id: 'y', note: 'Y', when: [{ question: 'timeframe', option: 'nope' }] }]
    expect(() => parseFitRules(rules({ redFlags: badQuestion }), QUESTIONS)).toThrow(/x.*nope/)
    expect(() => parseFitRules(rules({ redFlags: badOption }), QUESTIONS)).toThrow(/y.*nope/)
  })

  test('throws when a red flag has no conditions or no note', () => {
    const noWhen = [{ id: 'x', note: 'X', when: [] }]
    const noNote = [{ id: 'y', note: '', when: [{ question: 'timeframe', option: 'soon' }] }]
    expect(() => parseFitRules(rules({ redFlags: noWhen }), QUESTIONS)).toThrow(/x.*condition/)
    expect(() => parseFitRules(rules({ redFlags: noNote }), QUESTIONS)).toThrow(/y.*note/)
  })

  test('throws on duplicate red flag ids', () => {
    const flag = { id: 'dup', note: 'D', when: [{ question: 'timeframe', option: 'soon' }] }
    expect(() => parseFitRules(rules({ redFlags: [flag, flag] }), QUESTIONS)).toThrow(/duplicate.*dup/i)
  })
})
