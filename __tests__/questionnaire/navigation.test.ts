import { describe, expect, test } from 'vitest'
import { loadQuestionnaire } from '@/lib/questionnaire/load'
import { nextStepId, previousStepId, progress } from '@/lib/questionnaire/navigation'

const questionnaire = loadQuestionnaire()
// No kids, no pets, never hosts: Kids, Pets and Entertaining are skipped.
const quiet = { people: [{ age: 40 }], has_pets: 'no', hosting_frequency: 'never' }

describe('nextStepId and previousStepId', () => {
  test('Next and Back skip hidden steps', () => {
    expect(nextStepId(questionnaire, quiet, 'household')).toBe('everyday')
    expect(nextStepId(questionnaire, quiet, 'everyday')).toBe('travel')
    expect(previousStepId(questionnaire, quiet, 'everyday')).toBe('household')
    expect(previousStepId(questionnaire, quiet, 'travel')).toBe('everyday')
  })

  test('Next and Back include a step once its rule matches', () => {
    const withPets = { ...quiet, has_pets: 'yes' }
    expect(nextStepId(questionnaire, withPets, 'household')).toBe('pets')
    expect(previousStepId(questionnaire, withPets, 'everyday')).toBe('pets')
  })

  test('there is nothing before the first step or after the last', () => {
    expect(previousStepId(questionnaire, quiet, 'welcome')).toBeNull()
    expect(nextStepId(questionnaire, quiet, 'wish_list')).toBeNull()
  })

  test('works from a step that has just become hidden', () => {
    // On the Pets step, the person goes back, says No to pets, then returns.
    expect(nextStepId(questionnaire, quiet, 'pets')).toBe('everyday')
    expect(previousStepId(questionnaire, quiet, 'pets')).toBe('household')
  })
})

describe('progress', () => {
  test('counts visible steps with questions, so Welcome is not counted', () => {
    expect(progress(questionnaire, quiet, 'welcome')).toBeNull()
    expect(progress(questionnaire, quiet, 'contact')).toEqual({ number: 1, total: 10 })
    expect(progress(questionnaire, quiet, 'everyday')).toEqual({ number: 6, total: 10 })
    expect(progress(questionnaire, quiet, 'wish_list')).toEqual({ number: 10, total: 10 })
  })

  test('the total changes when a branch changes', () => {
    const busy = { people: [{ age: 40 }, { age: 9 }], has_pets: 'yes', hosting_frequency: 'monthly' }
    expect(progress(questionnaire, busy, 'everyday')).toEqual({ number: 8, total: 13 })
  })
})
