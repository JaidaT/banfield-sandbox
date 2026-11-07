import { describe, expect, test } from 'vitest'
import { loadQuestionnaire, loadSampleHouseholds } from '@/lib/questionnaire/load'
import { matches, visibleAnswers, visibleSteps } from '@/lib/questionnaire/visibility'
import type { Answers } from '@/lib/questionnaire/types'

const questionnaire = loadQuestionnaire()
const stepIds = (answers: Answers) => visibleSteps(questionnaire, answers).map((s) => s.step.id)
const questionIds = (answers: Answers, stepId: string) =>
  visibleSteps(questionnaire, answers)
    .find((s) => s.step.id === stepId)
    ?.questions.map((q) => q.id) ?? []

const noDerived = { household_min_age: null, adult_count: null }

describe('matches: each rule shape', () => {
  const answers: Answers = { type: 'renovation', rooms: ['kitchen'], size: 1200 }
  test('equals, in and includes', () => {
    expect(matches({ field: 'type', equals: 'renovation' }, answers, noDerived)).toBe(true)
    expect(matches({ field: 'type', equals: 'new_build' }, answers, noDerived)).toBe(false)
    expect(matches({ field: 'type', in: ['addition', 'renovation'] }, answers, noDerived)).toBe(true)
    expect(matches({ field: 'rooms', includes: 'kitchen' }, answers, noDerived)).toBe(true)
    expect(matches({ field: 'rooms', includes: 'basement' }, answers, noDerived)).toBe(false)
  })

  test('excludes: matches when the option is not ticked, including a blank answer', () => {
    expect(matches({ field: 'rooms', excludes: 'basement' }, answers, noDerived)).toBe(true)
    expect(matches({ field: 'rooms', excludes: 'kitchen' }, answers, noDerived)).toBe(false)
    expect(matches({ field: 'rooms', excludes: 'kitchen' }, {}, noDerived)).toBe(true)
    expect(matches({ field: 'rooms', excludes: 'kitchen' }, { rooms: [] }, noDerived)).toBe(true)
  })

  test('lessThan and atLeast, on answers and derived values', () => {
    expect(matches({ field: 'size', lessThan: 1500 }, answers, noDerived)).toBe(true)
    expect(matches({ field: 'size', atLeast: 1200 }, answers, noDerived)).toBe(true)
    expect(matches({ field: 'size', atLeast: 1201 }, answers, noDerived)).toBe(false)
    const derived = { household_min_age: 7, adult_count: 2 }
    expect(matches({ field: 'household_min_age', lessThan: 18 }, {}, derived)).toBe(true)
    expect(matches({ field: 'adult_count', atLeast: 2 }, {}, derived)).toBe(true)
  })

  test('any: matches when at least one rule matches', () => {
    const yes = { field: 'type', equals: 'renovation' }
    const no = { field: 'type', equals: 'new_build' }
    expect(matches({ any: [no, yes] }, answers, noDerived)).toBe(true)
    expect(matches({ any: [no, no] }, answers, noDerived)).toBe(false)
  })

  test('a missing answer never matches equals, in, includes or numbers', () => {
    expect(matches({ field: 'type', equals: 'renovation' }, {}, noDerived)).toBe(false)
    expect(matches({ field: 'size', lessThan: 5000 }, {}, noDerived)).toBe(false)
    expect(matches({ field: 'household_min_age', lessThan: 18 }, {}, noDerived)).toBe(false)
  })
})

describe('visibleSteps on the real questionnaire', () => {
  test('a blank questionnaire skips Kids, Pets and Entertaining', () => {
    expect(stepIds({})).not.toContain('kids')
    expect(stepIds({})).not.toContain('pets')
    expect(stepIds({})).not.toContain('entertaining')
  })

  test('a child under 18 shows Kids; pets Yes shows Pets; only Never skips Entertaining', () => {
    expect(stepIds({ people: [{ age: 40 }, { age: 17 }] })).toContain('kids')
    expect(stepIds({ people: [{ age: 40 }, { age: 18 }] })).not.toContain('kids')
    expect(stepIds({ has_pets: 'yes' })).toContain('pets')
    expect(stepIds({ has_pets: 'no' })).not.toContain('pets')
    expect(stepIds({ hosting_frequency: 'rarely' })).toContain('entertaining')
    expect(stepIds({ hosting_frequency: 'never' })).not.toContain('entertaining')
  })

  test('"Any kids?" Yes shows Kids, even with no ages filled in', () => {
    expect(stepIds({ has_kids: 'yes' })).toContain('kids')
    expect(stepIds({ has_kids: 'yes', people: [{ age: 40 }] })).toContain('kids')
    expect(stepIds({ has_kids: 'no' })).not.toContain('kids')
    // Backup: a child's age still shows Kids if "Any kids?" was skipped or answered No.
    expect(stepIds({ people: [{ age: 40 }, { age: 7 }] })).toContain('kids')
    expect(stepIds({ has_kids: 'no', people: [{ age: 40 }, { age: 7 }] })).toContain('kids')
  })

  test('furniture and styling hides square feet, contractor and Green/LEED', () => {
    const furniture = { project_type: 'furniture_styling' }
    expect(questionIds(furniture, 'project')).not.toContain('square_feet')
    expect(questionIds(furniture, 'investment')).not.toContain('has_contractor')
    expect(questionIds(furniture, 'wish_list')).not.toContain('green_design')
    const renovation = { project_type: 'renovation' }
    expect(questionIds(renovation, 'project')).toContain('square_feet')
    expect(questionIds(renovation, 'investment')).toContain('has_contractor')
    expect(questionIds(renovation, 'wish_list')).toContain('green_design')
  })

  test('a follow-up shows on the same step only when its answer matches', () => {
    expect(questionIds({ enough_storage: 'yes' }, 'everyday')).not.toContain('storage_focus')
    expect(questionIds({ enough_storage: 'not_sure' }, 'everyday')).toContain('storage_focus')
    expect(questionIds({ past_professionals: ['no'] }, 'working_together')).not.toContain('past_experience')
    expect(questionIds({ past_professionals: ['architect'] }, 'working_together')).toContain('past_experience')
  })

  test('shared taste shows only for 2 or more adults', () => {
    expect(questionIds({ people: [{ age: 34 }] }, 'style')).not.toContain('shared_taste')
    expect(questionIds({ people: [{ age: 34 }, { age: 36 }] }, 'style')).toContain('shared_taste')
  })

  test('mailing address boxes show unless "same as home" is ticked', () => {
    expect(questionIds({}, 'contact')).toContain('mailing_country')
    expect(questionIds({ same_mailing_address: ['same'] }, 'contact')).not.toContain('mailing_country')
  })

  test('a leftover answer to a hidden question does not open its follow-ups', () => {
    // Said Yes to a contractor on a renovation, then switched to furniture.
    const answers = { project_type: 'furniture_styling', has_contractor: 'yes' }
    expect(questionIds(answers, 'investment')).not.toContain('contractor_name')
  })
})

describe('visibleAnswers', () => {
  test('drops answers to hidden questions', () => {
    const answers: Answers = {
      project_type: 'facelift',
      has_contractor: 'yes',
      contractor_name: 'Sample Builders',
      has_pets: 'no',
      pets_roam: 'yes',
    }
    expect(visibleAnswers(questionnaire, answers)).toEqual({
      project_type: 'facelift',
      has_contractor: 'yes',
      contractor_name: 'Sample Builders',
      has_pets: 'no',
    })
    const furniture = visibleAnswers(questionnaire, { ...answers, project_type: 'furniture_styling' })
    expect(furniture).not.toHaveProperty('has_contractor')
    expect(furniture).not.toHaveProperty('contractor_name')
  })
})

describe('sample households (QUESTIONNAIRE_DISCOVERY pass criteria)', () => {
  for (const sample of loadSampleHouseholds()) {
    test(`${sample.label} sees exactly its expected steps`, () => {
      expect(stepIds(sample.answers)).toEqual(sample.expectedSteps)
    })

    test(`${sample.label} sees at most 7 inputs per step (Contact may reach 20, Everyday 8, see DECISIONS.md)`, () => {
      for (const { step, questions } of visibleSteps(questionnaire, sample.answers)) {
        const limit = step.id === 'contact' ? 20 : step.id === 'everyday' ? 8 : 7
        expect(questions.length, step.id).toBeLessThanOrEqual(limit)
      }
    })

    test(`${sample.label} has no answers to hidden questions`, () => {
      expect(visibleAnswers(questionnaire, sample.answers)).toEqual(sample.answers)
    })
  }
})
