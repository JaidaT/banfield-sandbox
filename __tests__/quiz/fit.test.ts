import { describe, expect, test } from 'vitest'
import { loadFitRules, loadQuestions, parseFitRules, parseLeadRules } from '@/lib/quiz/load'
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

const LEAD_QUESTIONS: Question[] = [
  ...QUESTIONS,
  {
    id: 'project_scope',
    kind: 'single',
    prompt: 'What are you dreaming up?',
    optional: false,
    criterion: 'scope',
    options: [
      { id: 'renovation', label: 'A renovation', weights: {} },
      { id: 'not_sure', label: 'Not sure yet', weights: {} },
    ],
  },
  {
    id: 'investment',
    kind: 'range',
    prompt: 'How much?',
    optional: false,
    criterion: 'investment',
    min: 0,
    max: 500000,
    step: 10000,
    options: [{ id: 'not_sure', label: 'Not sure yet', weights: {} }],
  },
]

function leadRules(overrides: Record<string, unknown> = {}) {
  return {
    projectQuestion: 'project_scope',
    investmentQuestion: 'investment',
    thresholds: {
      renovation: { hotFrom: 150000, warmFrom: 50000 },
      not_sure: { hotFrom: 150000, warmFrom: 50000 },
    },
    unsureStart: 'warm',
    details: [{ id: 'timeframe', label: 'Timeframe', questionId: 'timeframe' }],
    redFlags: [
      { id: 'late', note: 'Starting late', when: [{ question: 'timeframe', option: 'later' }] },
    ],
    ...overrides,
  }
}

describe('parseLeadRules', () => {
  test('accepts valid rules', () => {
    const lead = parseLeadRules(leadRules(), LEAD_QUESTIONS)
    expect(lead.projectQuestion).toBe('project_scope')
    expect(lead.investmentQuestion).toBe('investment')
    expect(lead.thresholds.renovation).toEqual({ hotFrom: 150000, warmFrom: 50000 })
    expect(lead.unsureStart).toBe('warm')
    expect(lead.details).toEqual([{ id: 'timeframe', label: 'Timeframe', questionId: 'timeframe' }])
    expect(lead.redFlags.map((f) => f.id)).toEqual(['late'])
  })

  test('throws when the project question is missing or not single choice', () => {
    expect(() => parseLeadRules(leadRules({ projectQuestion: 'nope' }), LEAD_QUESTIONS)).toThrow(
      /project.*nope/,
    )
    expect(() => parseLeadRules(leadRules({ projectQuestion: 'investment' }), LEAD_QUESTIONS)).toThrow(
      /project.*investment.*single/,
    )
  })

  test('throws when the investment question is missing or not a slider', () => {
    expect(() => parseLeadRules(leadRules({ investmentQuestion: 'nope' }), LEAD_QUESTIONS)).toThrow(
      /investment.*nope/,
    )
    expect(() =>
      parseLeadRules(leadRules({ investmentQuestion: 'timeframe' }), LEAD_QUESTIONS),
    ).toThrow(/investment.*timeframe.*range/)
  })

  test('throws when a project type has no thresholds', () => {
    const thresholds = { renovation: { hotFrom: 150000, warmFrom: 50000 } }
    expect(() => parseLeadRules(leadRules({ thresholds }), LEAD_QUESTIONS)).toThrow(/not_sure/)
  })

  test('throws when thresholds name a project type that does not exist', () => {
    const thresholds = {
      renovation: { hotFrom: 150000, warmFrom: 50000 },
      not_sure: { hotFrom: 150000, warmFrom: 50000 },
      castle: { hotFrom: 1, warmFrom: 0 },
    }
    expect(() => parseLeadRules(leadRules({ thresholds }), LEAD_QUESTIONS)).toThrow(/castle/)
  })

  test('throws when "hot from" is below "warm from"', () => {
    const thresholds = {
      renovation: { hotFrom: 40000, warmFrom: 50000 },
      not_sure: { hotFrom: 150000, warmFrom: 50000 },
    }
    expect(() => parseLeadRules(leadRules({ thresholds }), LEAD_QUESTIONS)).toThrow(
      /renovation.*hotFrom.*warmFrom/,
    )
  })

  test('throws when a threshold is missing, negative or not a number', () => {
    const missing = { renovation: { hotFrom: 150000 }, not_sure: { hotFrom: 1, warmFrom: 0 } }
    const negative = { renovation: { hotFrom: 1, warmFrom: -5 }, not_sure: { hotFrom: 1, warmFrom: 0 } }
    const text = { renovation: { hotFrom: '150K', warmFrom: 0 }, not_sure: { hotFrom: 1, warmFrom: 0 } }
    expect(() => parseLeadRules(leadRules({ thresholds: missing }), LEAD_QUESTIONS)).toThrow(
      /renovation.*warmFrom/,
    )
    expect(() => parseLeadRules(leadRules({ thresholds: negative }), LEAD_QUESTIONS)).toThrow(
      /renovation.*warmFrom/,
    )
    expect(() => parseLeadRules(leadRules({ thresholds: text }), LEAD_QUESTIONS)).toThrow(
      /renovation.*hotFrom/,
    )
  })

  test('throws when the unsure starting label is not hot, warm or cold', () => {
    expect(() => parseLeadRules(leadRules({ unsureStart: 'lukewarm' }), LEAD_QUESTIONS)).toThrow(
      /unsureStart.*lukewarm/,
    )
  })

  test('throws when a detail row names an unknown question, or ids repeat', () => {
    const unknown = [{ id: 'mood', label: 'Mood', questionId: 'mood' }]
    const dup = [
      { id: 'timeframe', label: 'Timeframe', questionId: 'timeframe' },
      { id: 'timeframe', label: 'Again', questionId: 'timeframe' },
    ]
    expect(() => parseLeadRules(leadRules({ details: unknown }), LEAD_QUESTIONS)).toThrow(/mood/)
    expect(() => parseLeadRules(leadRules({ details: dup }), LEAD_QUESTIONS)).toThrow(
      /duplicate.*timeframe/i,
    )
  })

  test('checks red flags the same way as before', () => {
    const badOption = [{ id: 'y', note: 'Y', when: [{ question: 'timeframe', option: 'nope' }] }]
    expect(() => parseLeadRules(leadRules({ redFlags: badOption }), LEAD_QUESTIONS)).toThrow(/y.*nope/)
  })
})
