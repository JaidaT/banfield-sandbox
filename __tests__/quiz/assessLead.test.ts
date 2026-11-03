import { describe, expect, test } from 'vitest'
import { assessLead } from '@/lib/quiz/assessLead'
import { loadLeadRules, loadQuestions, loadSampleSubmissions } from '@/lib/quiz/load'
import type { LeadRules, Question, Submission } from '@/lib/quiz/types'

const QUESTIONS: Question[] = [
  {
    id: 'project',
    kind: 'single',
    prompt: 'What?',
    optional: false,
    criterion: 'scope',
    options: [
      { id: 'reno', label: 'A renovation', weights: {} },
      { id: 'styling', label: 'Styling', weights: {} },
      { id: 'not_sure', label: 'Not sure yet', weights: {} },
    ],
  },
  {
    id: 'money',
    kind: 'range',
    prompt: 'How much?',
    optional: false,
    criterion: 'investment',
    min: 0,
    max: 500000,
    step: 10000,
    options: [{ id: 'not_sure', label: 'Not sure yet', weights: {} }],
  },
  {
    id: 'when',
    kind: 'single',
    prompt: 'When?',
    optional: false,
    criterion: 'timeframe',
    options: [
      { id: 'soon', label: 'Soon', weights: {} },
      { id: 'exploring', label: 'Just exploring', weights: {} },
    ],
  },
  {
    id: 'coffee',
    kind: 'single',
    prompt: 'Coffee?',
    optional: false,
    options: [
      { id: 'black', label: 'Black', weights: { decisive_delegator: 1 } },
      { id: 'latte', label: 'Latte', weights: { creative_collaborator: 1 } },
    ],
  },
]

const RULES: LeadRules = {
  projectQuestion: 'project',
  investmentQuestion: 'money',
  thresholds: {
    reno: { hotFrom: 150000, warmFrom: 50000 },
    styling: { hotFrom: 50000, warmFrom: 20000 },
    not_sure: { hotFrom: 150000, warmFrom: 50000 },
  },
  unsureStart: 'warm',
  details: [
    { id: 'project', label: 'Project type', questionId: 'project' },
    { id: 'investment', label: 'Investment', questionId: 'money' },
    { id: 'timeframe', label: 'Timeframe', questionId: 'when' },
  ],
  warningSigns: [
    { id: 'exploring', note: 'Just exploring', when: [{ question: 'when', option: 'exploring' }] },
    {
      id: 'reno_exploring',
      note: 'Renovation, but just exploring',
      when: [
        { question: 'project', option: 'reno' },
        { question: 'when', option: 'exploring' },
      ],
    },
  ],
}

function submission(answers: Submission['answers'], city = 'Burnaby'): Submission {
  return {
    id: 's',
    contact: {
      name: 'N',
      email: 'n@example.com',
      phone: '604-555-0100',
      siteAddress: { street: '1 St', city, postalCode: 'V5A 0A1' },
    },
    answers,
    durationSeconds: 300,
  }
}

const lead = (answers: Submission['answers']) => assessLead(submission(answers), QUESTIONS, RULES)

describe('assessLead: starting label from project type + investment', () => {
  test('hot at or above "hot from", with a plain-language reason', () => {
    expect(lead({ project: 'reno', money: 150000 }).temperature).toBe('hot')
    const result = lead({ project: 'reno', money: 200000 })
    expect(result).toMatchObject({ temperature: 'hot', startingTemperature: 'hot', lowered: false })
    expect(result.reasons).toEqual(['A renovation at $200K: hot'])
  })

  test('warm from "warm from" up to just below "hot from"', () => {
    expect(lead({ project: 'reno', money: 50000 }).temperature).toBe('warm')
    expect(lead({ project: 'reno', money: 140000 }).temperature).toBe('warm')
  })

  test('cold below "warm from"', () => {
    expect(lead({ project: 'reno', money: 40000 }).temperature).toBe('cold')
    expect(lead({ project: 'reno', money: 0 }).temperature).toBe('cold')
  })

  test('each project type uses its own thresholds', () => {
    expect(lead({ project: 'styling', money: 60000 }).temperature).toBe('hot')
    expect(lead({ project: 'reno', money: 60000 }).temperature).toBe('warm')
  })

  test('"Not sure yet" as a project type still uses its own thresholds', () => {
    expect(lead({ project: 'not_sure', money: 200000 }).temperature).toBe('hot')
  })

  test('an unsure or skipped investment, or a skipped project type, starts at warm', () => {
    const cases: Submission['answers'][] = [
      { project: 'reno', money: 'not_sure' },
      { project: 'reno' },
      { money: 300000 },
    ]
    for (const answers of cases) {
      const result = lead(answers)
      expect(result.temperature, JSON.stringify(answers)).toBe('warm')
      expect(result.reasons[0], JSON.stringify(answers)).toMatch(/starts warm$/)
    }
  })
})

describe('assessLead: warning signs', () => {
  test('one warning sign lowers the label one step', () => {
    const result = lead({ project: 'styling', money: 60000, when: 'exploring' })
    expect(result).toMatchObject({ temperature: 'warm', startingTemperature: 'hot', lowered: true })
    expect(result.warningSigns.map((f) => f.id)).toEqual(['exploring'])
    expect(result.reasons[1]).toMatch(/lowered to warm/i)
  })

  test('two warning signs still lower it only one step', () => {
    const result = lead({ project: 'reno', money: 200000, when: 'exploring' })
    expect(result.warningSigns).toHaveLength(2)
    expect(result.temperature).toBe('warm')
  })

  test('cold stays cold', () => {
    const result = lead({ project: 'reno', money: 10000, when: 'exploring' })
    expect(result).toMatchObject({ temperature: 'cold', lowered: false })
  })

  test('a warning sign is raised only when every condition matches', () => {
    expect(lead({ project: 'styling', when: 'exploring' }).warningSigns.map((f) => f.id)).toEqual(['exploring'])
    expect(lead({ project: 'reno', when: 'soon' }).warningSigns).toEqual([])
  })
})

describe('assessLead: details and independence', () => {
  test('lists each detail row with a readable answer, and none when unanswered', () => {
    const result = lead({ project: 'reno', money: 500000 })
    expect(result.details).toEqual([
      { id: 'project', label: 'Project type', answer: 'A renovation' },
      { id: 'investment', label: 'Investment', answer: '$500K+' },
      { id: 'timeframe', label: 'Timeframe' },
    ])
    expect(lead({ money: 'not_sure' }).details[1].answer).toBe('Not sure yet')
  })

  // DECISIONS.md: location removed from fit entirely.
  test('the site address never changes the result', () => {
    const answers = { project: 'reno', money: 200000 }
    expect(assessLead(submission(answers, 'Edmonton'), QUESTIONS, RULES)).toEqual(
      assessLead(submission(answers, 'Burnaby'), QUESTIONS, RULES),
    )
  })

  // DECISIONS.md: fit and client type are independent.
  test('working-style answers never change the result', () => {
    expect(lead({ project: 'reno', money: 200000, coffee: 'black' })).toEqual(
      lead({ project: 'reno', money: 200000, coffee: 'latte' }),
    )
  })
})

describe('assessing the sample submissions', () => {
  const questions = loadQuestions()
  const rules = loadLeadRules()
  const samples = loadSampleSubmissions()
  const leadFor = (id: string) => {
    const sample = samples.find((s) => s.id === id)
    if (!sample) throw new Error(`no sample ${id}`)
    return assessLead(sample, questions, rules)
  }

  test.each([
    ['decisive-delegator', 'hot'],
    ['analytical-validator', 'hot'],
    ['mixed-cautious-controller', 'warm'],
    ['weak-fit-explorer', 'cold'],
    ['skipper', 'warm'],
    ['out-of-area-hot', 'hot'],
  ])('%s is a %s lead', (id, temperature) => {
    expect(leadFor(id).temperature).toBe(temperature)
  })

  test('the explorer raises the early-stage warning signs', () => {
    expect(leadFor('weak-fit-explorer').warningSigns.map((f) => f.id)).toEqual([
      'just_exploring',
      'early_one_time_session',
      'early_no_budget',
    ])
  })

  test('the skipper is lowered from hot to warm by the builder note', () => {
    const result = leadFor('skipper')
    expect(result.warningSigns.map((f) => f.id)).toEqual(['builder_underway'])
    expect(result).toMatchObject({ startingTemperature: 'hot', lowered: true })
  })

  test('the hot lead outside the Lower Mainland is in Edmonton', () => {
    expect(samples.find((s) => s.id === 'out-of-area-hot')?.contact.siteAddress.city).toBe('Edmonton')
  })
})
