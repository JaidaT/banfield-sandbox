import { describe, expect, test } from 'vitest'
import { assessFit } from '@/lib/quiz/assessFit'
import { loadFitRules, loadQuestions, loadSampleSubmissions } from '@/lib/quiz/load'
import type { FitRules, Question, Submission } from '@/lib/quiz/types'

const QUESTIONS: Question[] = [
  {
    id: 'when',
    kind: 'single',
    prompt: 'When?',
    optional: false,
    criterion: 'timeframe',
    options: [
      { id: 'soon', label: 'Soon', weights: {} },
      { id: 'never', label: 'Never', weights: {} },
    ],
  },
  {
    id: 'money',
    kind: 'single',
    prompt: 'Budget?',
    optional: false,
    criterion: 'investment',
    options: [
      { id: 'big', label: 'Big', weights: {} },
      { id: 'small', label: 'Small', weights: {} },
    ],
  },
]

const RULES: FitRules = {
  criteria: {
    timeframe: { id: 'timeframe', label: 'Timeframe', questionId: 'when', ratings: { soon: 'strong', never: 'weak' } },
    investment: { id: 'investment', label: 'Investment', questionId: 'money', ratings: { big: 'strong', small: 'weak' } },
  },
  serviceAreas: ['Burnaby', 'Port Moody'],
  redFlags: [{ id: 'no_time', note: 'Never starting', when: [{ question: 'when', option: 'never' }] }],
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

describe('assessFit', () => {
  test('rates each criterion from the answer, with the answer label', () => {
    const fit = assessFit(submission({ when: 'soon', money: 'small' }), QUESTIONS, RULES)
    expect(fit.criteria).toContainEqual({ id: 'timeframe', label: 'Timeframe', rating: 'strong', answer: 'Soon' })
    expect(fit.criteria).toContainEqual({ id: 'investment', label: 'Investment', rating: 'weak', answer: 'Small' })
  })

  test('rates location strong inside the service area, ignoring case and spaces', () => {
    const fit = assessFit(submission({}, '  port moody '), QUESTIONS, RULES)
    expect(fit.criteria).toContainEqual({ id: 'location', label: 'Location', rating: 'strong', answer: 'port moody' })
  })

  test('rates location possible (never weak) outside the service area', () => {
    const fit = assessFit(submission({}, 'Kelowna'), QUESTIONS, RULES)
    expect(fit.criteria.find((c) => c.id === 'location')?.rating).toBe('possible')
  })

  test('marks a skipped fit question as unanswered', () => {
    const fit = assessFit(submission({ when: 'soon' }), QUESTIONS, RULES)
    expect(fit.criteria.find((c) => c.id === 'investment')).toMatchObject({ rating: 'unanswered' })
  })

  test('raises a red flag only when every condition matches', () => {
    expect(assessFit(submission({ when: 'never' }), QUESTIONS, RULES).redFlags.map((f) => f.id)).toEqual(['no_time'])
    expect(assessFit(submission({ when: 'soon' }), QUESTIONS, RULES).redFlags).toEqual([])
  })

  test('overall is strong when every criterion is strong and nothing is flagged', () => {
    expect(assessFit(submission({ when: 'soon', money: 'big' }), QUESTIONS, RULES).overall).toBe('strong')
  })

  test('overall is possible with one concern or an unanswered question', () => {
    expect(assessFit(submission({ when: 'soon', money: 'small' }), QUESTIONS, RULES).overall).toBe('possible')
    expect(assessFit(submission({ when: 'soon' }), QUESTIONS, RULES).overall).toBe('possible')
  })

  test('overall is weak with two or more concerns (weak ratings plus red flags)', () => {
    // "never" is weak and also raises a red flag: two concerns.
    expect(assessFit(submission({ when: 'never', money: 'big' }), QUESTIONS, RULES).overall).toBe('weak')
  })
})

describe('assessing the sample submissions', () => {
  const questions = loadQuestions()
  const rules = loadFitRules()
  const samples = loadSampleSubmissions()
  const fitFor = (id: string) => {
    const sample = samples.find((s) => s.id === id)
    if (!sample) throw new Error(`no sample ${id}`)
    return assessFit(sample, questions, rules)
  }

  test.each([
    ['decisive-delegator', 'strong'],
    ['analytical-validator', 'strong'],
    ['mixed-cautious-controller', 'possible'],
    ['weak-fit-explorer', 'weak'],
    ['skipper', 'possible'],
  ])('%s is a %s fit', (id, overall) => {
    expect(fitFor(id).overall).toBe(overall)
  })

  test('the weak-fit explorer raises both early-stage notes', () => {
    expect(fitFor('weak-fit-explorer').redFlags.map((f) => f.id)).toEqual([
      'early_one_time_session',
      'early_no_budget',
    ])
  })

  test('the skipper raises the builder-underway note', () => {
    expect(fitFor('skipper').redFlags.map((f) => f.id)).toEqual(['builder_underway'])
  })

  // Fit and archetype are independent axes (DECISIONS.md).
  test('changing working-style answers does not change fit', () => {
    const sample = samples.find((s) => s.id === 'decisive-delegator')
    if (!sample) throw new Error('missing sample')
    const changed = { ...sample, answers: { ...sample.answers, decision_style: 'talk_it_through', coffee: 'pour_over' } }
    expect(assessFit(changed, questions, rules)).toEqual(assessFit(sample, questions, rules))
  })
})
