import { describe, expect, test } from 'vitest'
import { deriveValues } from '@/lib/questionnaire/derived'
import type { Answers } from '@/lib/questionnaire/types'

describe('deriveValues', () => {
  test('finds the youngest age and counts adults (18 and over)', () => {
    const answers = {
      people: [
        { name: 'Maya', age: 38 },
        { name: 'Sam', age: 40 },
        { name: 'Lily', age: 10 },
        { name: 'Theo', age: 7 },
      ],
    }
    expect(deriveValues(answers)).toEqual({ household_min_age: 7, adult_count: 2 })
  })

  test('an 18 year old counts as an adult, a 17 year old does not', () => {
    const answers = { people: [{ age: 18 }, { age: 17 }] }
    expect(deriveValues(answers)).toEqual({ household_min_age: 17, adult_count: 1 })
  })

  test('cards without an age are ignored', () => {
    const answers: Answers = { people: [{ name: 'Pat' }, { name: 'Lee', age: 44 }] }
    expect(deriveValues(answers)).toEqual({ household_min_age: 44, adult_count: 1 })
  })

  test('gives null for both when no ages are entered, so age rules do not match', () => {
    expect(deriveValues({})).toEqual({ household_min_age: null, adult_count: null })
    expect(deriveValues({ people: [] })).toEqual({ household_min_age: null, adult_count: null })
    expect(deriveValues({ people: [{ name: 'Pat' }] })).toEqual({ household_min_age: null, adult_count: null })
  })
})
