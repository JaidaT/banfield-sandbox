import { describe, expect, test } from 'vitest'
import { loadFitRules, loadQuestions, parseLeadRules } from '@/lib/quiz/load'
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

describe('loadFitRules', () => {
  test('loads the lead rules from data/fit.json, with thresholds for every project type', () => {
    const rules = loadFitRules()
    const project = loadQuestions().find((q) => q.id === rules.projectQuestion)
    for (const o of project?.options ?? []) {
      expect(rules.thresholds[o.id], `no thresholds for ${o.id}`).toBeDefined()
    }
  })

  test('the investment question is the $0 to $500K+ slider in $10K steps', () => {
    const investment = loadQuestions().find((q) => q.id === loadFitRules().investmentQuestion)
    expect(investment).toMatchObject({ kind: 'range', min: 0, max: 500000, step: 10000 })
  })

  test('the brief shows project type, investment, timeframe, stage and type of help', () => {
    expect(loadFitRules().details.map((d) => d.questionId)).toEqual([
      'project_scope',
      'investment',
      'timeframe',
      'readiness',
      'service',
    ])
  })

  // Brand Standards: a one-time session is Banfield's paid "Designer on Call" service,
  // so choosing it is never a warning sign on its own.
  test('wanting a one-time session alone is not a warning sign', () => {
    for (const flag of loadFitRules().redFlags) {
      const onlyConsult = flag.when.every((c) => c.question === 'service' && c.option === 'consult')
      expect(onlyConsult, flag.id).toBe(false)
    }
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

  test('throws when a red flag points at an unknown question or answer', () => {
    const badQuestion = [{ id: 'x', note: 'X', when: [{ question: 'nope', option: 'soon' }] }]
    const badOption = [{ id: 'y', note: 'Y', when: [{ question: 'timeframe', option: 'nope' }] }]
    expect(() => parseLeadRules(leadRules({ redFlags: badQuestion }), LEAD_QUESTIONS)).toThrow(/x.*nope/)
    expect(() => parseLeadRules(leadRules({ redFlags: badOption }), LEAD_QUESTIONS)).toThrow(/y.*nope/)
  })

  test('throws when a red flag has no conditions or no note', () => {
    const noWhen = [{ id: 'x', note: 'X', when: [] }]
    const noNote = [{ id: 'y', note: '', when: [{ question: 'timeframe', option: 'soon' }] }]
    expect(() => parseLeadRules(leadRules({ redFlags: noWhen }), LEAD_QUESTIONS)).toThrow(/x.*condition/)
    expect(() => parseLeadRules(leadRules({ redFlags: noNote }), LEAD_QUESTIONS)).toThrow(/y.*note/)
  })

  test('throws on duplicate red flag ids', () => {
    const flag = { id: 'dup', note: 'D', when: [{ question: 'timeframe', option: 'soon' }] }
    expect(() => parseLeadRules(leadRules({ redFlags: [flag, flag] }), LEAD_QUESTIONS)).toThrow(
      /duplicate.*dup/i,
    )
  })
})
