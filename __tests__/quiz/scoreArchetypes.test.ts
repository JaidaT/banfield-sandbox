import { describe, expect, test } from 'vitest'
import {
  loadArchetypes,
  loadQuestions,
  loadSampleSubmissions,
  loadSignalRules,
} from '@/lib/quiz/load'
import { scoreArchetypes } from '@/lib/quiz/scoreArchetypes'
import { evaluateSignals } from '@/lib/quiz/signals'
import type { Archetype, Question, SignalRule, Submission } from '@/lib/quiz/types'

function archetype(id: string): Archetype {
  return {
    id,
    label: id.toUpperCase(),
    tagline: '',
    description: '',
    segments: [],
    signals: [],
    communication: 'c',
    pacing: 'p',
    pitch: 'p',
    risks: ['r'],
    brief_tips: '',
  }
}

const ARCHETYPES = ['a', 'b', 'c'].map(archetype)

const QUESTIONS: Question[] = [
  {
    id: 'one',
    kind: 'single',
    prompt: 'One',
    optional: false,
    options: [
      { id: 'to_a', label: 'A', weights: { a: 3 } },
      { id: 'to_b', label: 'B', weights: { b: 3, c: 1 } },
      { id: 'none', label: 'None', weights: {} },
    ],
  },
  {
    id: 'many',
    kind: 'multi',
    prompt: 'Many',
    optional: false,
    maxSelections: 2,
    options: [
      { id: 'x', label: 'X', weights: { a: 2 } },
      { id: 'y', label: 'Y', weights: { c: 2 } },
    ],
  },
  { id: 'words', kind: 'text', prompt: 'Words', optional: true, options: [] },
]

function submission(answers: Submission['answers'], durationSeconds = 300): Submission {
  return {
    id: 's',
    contact: {
      name: 'N',
      email: 'n@example.com',
      phone: '604-555-0100',
      siteAddress: { street: '1 St', city: 'Burnaby', postalCode: 'V5A 0A1' },
    },
    answers,
    durationSeconds,
  }
}

describe('evaluateSignals', () => {
  const rules: SignalRule[] = [
    { id: 'fast', signal: 'durationSeconds', op: 'lt', value: 150, weights: {}, note: 'Fast' },
    { id: 'skips', signal: 'skippedCount', op: 'gte', value: 2, weights: {}, note: 'Skipped' },
    { id: 'long', signal: 'avgTextLength', op: 'gte', value: 10, weights: { b: 2 }, note: 'Long' },
    { id: 'short', signal: 'avgTextLength', op: 'lt', value: 5, weights: { a: 1 }, note: 'Short' },
  ]

  test('measures duration, skipped questions and average text length', () => {
    const result = evaluateSignals(submission({ one: 'to_a', words: 'twelve chars' }, 100), QUESTIONS, rules)
    expect(result.values).toEqual({ durationSeconds: 100, skippedCount: 1, avgTextLength: 12 })
    expect(result.matched.map((r) => r.id)).toEqual(['fast', 'long'])
  })

  test('every unanswered question counts as skipped', () => {
    const result = evaluateSignals(submission({}), QUESTIONS, rules)
    expect(result.values.skippedCount).toBe(3)
    expect(result.matched.map((r) => r.id)).toContain('skips')
  })

  test('text-length rules do not apply when no text was written', () => {
    const result = evaluateSignals(submission({ one: 'to_a', words: '   ' }), QUESTIONS, rules)
    expect(result.values.avgTextLength).toBeNull()
    expect(result.matched.map((r) => r.id)).not.toContain('short')
  })
})

describe('scoreArchetypes', () => {
  test('sums weights from pick-one and pick-several answers', () => {
    const blend = scoreArchetypes(submission({ one: 'to_b', many: ['x', 'y'] }), QUESTIONS, ARCHETYPES, [])
    const points = Object.fromEntries(blend.scores.map((s) => [s.id, s.points]))
    expect(points).toEqual({ a: 2, b: 3, c: 3 })
  })

  test('adds points from matched signal rules', () => {
    const rules: SignalRule[] = [
      { id: 'long', signal: 'avgTextLength', op: 'gte', value: 1, weights: { a: 5 }, note: 'Long' },
    ]
    const blend = scoreArchetypes(submission({ one: 'to_b', words: 'hello' }), QUESTIONS, ARCHETYPES, rules)
    expect(blend.scores[0]).toMatchObject({ id: 'a', points: 5 })
  })

  test('percentages are whole numbers that add up to 100', () => {
    const blend = scoreArchetypes(submission({ one: 'to_b', many: ['x', 'y'] }), QUESTIONS, ARCHETYPES, [])
    for (const s of blend.scores) expect(Number.isInteger(s.percent)).toBe(true)
    expect(blend.scores.reduce((sum, s) => sum + s.percent, 0)).toBe(100)
  })

  test('sorts highest first and keeps archetype order for ties', () => {
    const blend = scoreArchetypes(submission({ one: 'to_b', many: ['x', 'y'] }), QUESTIONS, ARCHETYPES, [])
    expect(blend.scores.map((s) => s.id)).toEqual(['b', 'c', 'a'])
  })

  test('includes labels for the brief', () => {
    const blend = scoreArchetypes(submission({ one: 'to_a' }), QUESTIONS, ARCHETYPES, [])
    expect(blend.scores[0]).toMatchObject({ id: 'a', label: 'A', percent: 100 })
  })

  test('reports insufficient data when no answer carries weights', () => {
    const blend = scoreArchetypes(submission({ one: 'none' }), QUESTIONS, ARCHETYPES, [])
    expect(blend.insufficient).toBe(true)
    expect(blend.scores.every((s) => s.percent === 0)).toBe(true)
  })

  test('works with any number of archetypes', () => {
    const six = [...ARCHETYPES, ...['d', 'e', 'f'].map(archetype)]
    const blend = scoreArchetypes(submission({ one: 'to_a' }), QUESTIONS, six, [])
    expect(blend.scores).toHaveLength(6)
    expect(blend.scores.reduce((sum, s) => sum + s.percent, 0)).toBe(100)
  })
})

describe('scoring the sample submissions', () => {
  const questions = loadQuestions()
  const archetypes = loadArchetypes()
  const rules = loadSignalRules()
  const blendFor = (id: string) => {
    const sample = loadSampleSubmissions().find((s) => s.id === id)
    if (!sample) throw new Error(`no sample ${id}`)
    return scoreArchetypes(sample, questions, archetypes, rules)
  }

  test.each([
    ['decisive-delegator', 'decisive_delegator'],
    ['analytical-validator', 'analytical_validator'],
    ['weak-fit-explorer', 'creative_collaborator'],
    ['skipper', 'hands_on_controller'],
  ])('%s comes out as %s', (sampleId, archetypeId) => {
    expect(blendFor(sampleId).scores[0].id).toBe(archetypeId)
  })

  test('the mixed sample blends Cautious Reassurance Seeker and Hands-On Controller', () => {
    const topTwo = blendFor('mixed-cautious-controller').scores.slice(0, 2).map((s) => s.id)
    expect(topTwo).toEqual(['cautious_reassurance_seeker', 'hands_on_controller'])
  })
})
