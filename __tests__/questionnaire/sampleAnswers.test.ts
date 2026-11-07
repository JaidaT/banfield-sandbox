import { describe, expect, test } from 'vitest'
import { loadQuestionnaire, loadSampleHouseholds, parseSampleHouseholds } from '@/lib/questionnaire/load'

const questionnaire = loadQuestionnaire()

// One small valid sample; each test changes one thing to break it.
function sample(answers: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
  return {
    samples: [
      {
        id: 'test_home',
        label: 'Test home',
        note: 'For tests',
        expectedSteps: ['welcome', 'contact'],
        answers: { name: 'Pat Example', project_type: 'renovation', ...answers },
        ...extra,
      },
    ],
  }
}
const parse = (raw: unknown) => parseSampleHouseholds(raw, questionnaire)

describe('sample-answers.json', () => {
  test('loads the 4 households from QUESTIONNAIRE_DISCOVERY', () => {
    expect(loadSampleHouseholds().map((s) => s.id)).toEqual([
      'growing_family',
      'furniture_couple',
      'solo_new_build',
      'multi_generational',
    ])
  })
})

describe('parseSampleHouseholds', () => {
  test('accepts answers of every kind', () => {
    const [s] = parse(
      sample({
        spaces: ['kitchen', 'basement'],
        square_feet: 2400,
        people: [{ name: 'Pat', age: 40, occupation: 'Nurse' }],
        style_sets: { living_rooms: { favourite: 'a', least: 'c' } },
      }),
    )
    expect(s.answers.square_feet).toBe(2400)
    expect(s.expectedSteps).toEqual(['welcome', 'contact'])
  })

  test('throws on a missing samples list, a duplicate id, or an unknown expected step', () => {
    expect(() => parse({})).toThrow(/samples/)
    const one = sample().samples[0]
    expect(() => parse({ samples: [one, one] })).toThrow(/duplicate.*test_home/i)
    expect(() => parse(sample({}, { expectedSteps: ['castle'] }))).toThrow(/test_home.*castle/)
  })

  test('throws on an answer to a question that does not exist', () => {
    expect(() => parse(sample({ favourite_colour: 'blue' }))).toThrow(/test_home.*favourite_colour/)
  })

  test('throws when an answer does not fit its question', () => {
    expect(() => parse(sample({ project_type: 'castle' }))).toThrow(/test_home.*project_type.*castle/)
    expect(() => parse(sample({ spaces: 'kitchen' }))).toThrow(/test_home.*spaces.*list/)
    expect(() => parse(sample({ spaces: ['kitchen', 'moat'] }))).toThrow(/test_home.*spaces.*moat/)
    expect(() => parse(sample({ square_feet: 'big' }))).toThrow(/test_home.*square_feet.*number/)
    expect(() => parse(sample({ name: 42 }))).toThrow(/test_home.*name.*text/)
  })

  test('throws on a repeater card with an unknown field or a bad answer', () => {
    expect(() => parse(sample({ people: { name: 'Pat' } }))).toThrow(/test_home.*people.*list/)
    expect(() => parse(sample({ people: [{ name: 'Pat', shoe_size: 9 }] }))).toThrow(/test_home.*people.*shoe_size/)
    expect(() => parse(sample({ people: [{ name: 'Pat', age: 'forty' }] }))).toThrow(/test_home.*people.*age.*number/)
  })

  test('throws on a picture pick that is not in its set, or the same picture twice', () => {
    expect(() => parse(sample({ style_sets: { pools: { favourite: 'a' } } }))).toThrow(/test_home.*style_sets.*pools/)
    expect(() => parse(sample({ style_sets: { kitchens: { favourite: 'z' } } }))).toThrow(/test_home.*style_sets.*z/)
    expect(() => parse(sample({ style_sets: { kitchens: { favourite: 'a', least: 'a' } } }))).toThrow(
      /test_home.*style_sets.*same/,
    )
  })
})
