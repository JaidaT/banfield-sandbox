import { describe, expect, test } from 'vitest'
import { loadFitRules, loadQuestions, loadSampleSubmissions } from '@/lib/quiz/load'
import { validateSubmission } from '@/lib/quiz/submission'
import type { Question, Submission } from '@/lib/quiz/types'

const QUESTIONS: Question[] = [
  {
    id: 'pick_one',
    kind: 'single',
    prompt: 'Pick one',
    optional: false,
    options: [
      { id: 'a', label: 'A', weights: {} },
      { id: 'b', label: 'B', weights: {} },
    ],
  },
  {
    id: 'pick_two',
    kind: 'multi',
    prompt: 'Pick up to two',
    optional: false,
    maxSelections: 2,
    options: [
      { id: 'x', label: 'X', weights: {} },
      { id: 'y', label: 'Y', weights: {} },
      { id: 'z', label: 'Z', weights: {} },
    ],
  },
  { id: 'tell_us', kind: 'text', prompt: 'Tell us', optional: true, options: [] },
]

function submission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 's1',
    contact: {
      name: 'Test Person',
      email: 'test@example.com',
      phone: '604-555-0100',
      siteAddress: { street: '1 Test St', city: 'Burnaby', postalCode: 'V5A 0A1' },
    },
    answers: { pick_one: 'a', pick_two: ['x', 'y'], tell_us: 'Hello' },
    durationSeconds: 200,
    ...overrides,
  }
}

describe('validateSubmission', () => {
  test('a valid submission has no problems', () => {
    expect(validateSubmission(submission(), QUESTIONS)).toEqual([])
  })

  test('skipped questions are allowed (skipping is a signal, not an error)', () => {
    expect(validateSubmission(submission({ answers: {} }), QUESTIONS)).toEqual([])
  })

  test('flags an answer to a question that does not exist', () => {
    const problems = validateSubmission(submission({ answers: { nope: 'a' } }), QUESTIONS)
    expect(problems.join('\n')).toMatch(/nope/)
  })

  test('flags an answer option that does not exist', () => {
    const problems = validateSubmission(submission({ answers: { pick_one: 'c' } }), QUESTIONS)
    expect(problems.join('\n')).toMatch(/pick_one.*c/)
  })

  test('flags a list given to a pick-one question', () => {
    const problems = validateSubmission(submission({ answers: { pick_one: ['a'] } }), QUESTIONS)
    expect(problems.join('\n')).toMatch(/pick_one/)
  })

  test('flags a single value given to a pick-several question', () => {
    const problems = validateSubmission(submission({ answers: { pick_two: 'x' } }), QUESTIONS)
    expect(problems.join('\n')).toMatch(/pick_two/)
  })

  test('flags too many selections', () => {
    const problems = validateSubmission(
      submission({ answers: { pick_two: ['x', 'y', 'z'] } }),
      QUESTIONS,
    )
    expect(problems.join('\n')).toMatch(/pick_two.*2/)
  })

  test('flags a non-text answer to a text question', () => {
    const problems = validateSubmission(submission({ answers: { tell_us: ['a'] } }), QUESTIONS)
    expect(problems.join('\n')).toMatch(/tell_us/)
  })

  test('flags missing contact details (DISCOVERY P1)', () => {
    const base = submission()
    const noPhone = { ...base, contact: { ...base.contact, phone: '' } }
    const noCity = {
      ...base,
      contact: { ...base.contact, siteAddress: { ...base.contact.siteAddress, city: '' } },
    }
    expect(validateSubmission(noPhone, QUESTIONS).join('\n')).toMatch(/phone/)
    expect(validateSubmission(noCity, QUESTIONS).join('\n')).toMatch(/city/)
  })

  test('flags an email without an @', () => {
    const base = submission()
    const bad = { ...base, contact: { ...base.contact, email: 'not-an-email' } }
    expect(validateSubmission(bad, QUESTIONS).join('\n')).toMatch(/email/)
  })

  test('flags a negative duration', () => {
    expect(validateSubmission(submission({ durationSeconds: -5 }), QUESTIONS).join('\n')).toMatch(
      /duration/,
    )
  })
})

describe('loadSampleSubmissions', () => {
  test('loads at least five samples with unique ids', () => {
    const samples = loadSampleSubmissions()
    expect(samples.length).toBeGreaterThanOrEqual(5)
    expect(new Set(samples.map((s) => s.id)).size).toBe(samples.length)
  })

  test('every sample is valid against the real question bank', () => {
    const questions = loadQuestions()
    for (const s of loadSampleSubmissions()) {
      expect(validateSubmission(s, questions), s.id).toEqual([])
    }
  })

  test('every sample says who it represents', () => {
    for (const s of loadSampleSubmissions()) expect(s.note, s.id).toBeTruthy()
  })

  test('includes a site outside the service area', () => {
    const areas = loadFitRules().serviceAreas
    expect(loadSampleSubmissions().some((s) => !areas.includes(s.contact.siteAddress.city))).toBe(
      true,
    )
  })

  test('includes someone who skipped two or more questions', () => {
    const questionIds = loadQuestions().map((q) => q.id)
    const skippedTwo = loadSampleSubmissions().some(
      (s) => questionIds.filter((id) => !(id in s.answers)).length >= 2,
    )
    expect(skippedTwo).toBe(true)
  })
})
