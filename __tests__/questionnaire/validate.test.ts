import { describe, expect, test } from 'vitest'
import { loadQuestionnaire, loadSampleHouseholds, parseQuestionnaire } from '@/lib/questionnaire/load'
import { allProblems, stepProblems } from '@/lib/questionnaire/validate'
import type { Answers } from '@/lib/questionnaire/types'

const questionnaire = loadQuestionnaire()
const ids = (problems: { questionId: string }[]) => problems.map((p) => p.questionId)
const filledIn: Answers = { name: 'Pat', email: 'pat@example.com', phone: '604-555-0100', project_type: 'renovation' }

describe('required questions', () => {
  test('a blank questionnaire is missing only contact details and project type', () => {
    expect(ids(allProblems(questionnaire, {}))).toEqual(['name', 'email', 'phone', 'project_type'])
  })

  test('spaces only count as blank', () => {
    expect(ids(stepProblems(questionnaire, { ...filledIn, name: '   ' }, 'contact'))).toEqual(['name'])
  })

  test('nothing is missing once they are answered', () => {
    expect(allProblems(questionnaire, filledIn)).toEqual([])
  })

  test('stepProblems only lists problems on that step', () => {
    expect(ids(stepProblems(questionnaire, {}, 'project'))).toEqual(['project_type'])
    expect(stepProblems(questionnaire, {}, 'household')).toEqual([])
  })

  test('the message names the question and its step', () => {
    expect(stepProblems(questionnaire, {}, 'project')[0]).toEqual({
      stepId: 'project',
      questionId: 'project_type',
      message: 'Please answer "What are we working on?"',
    })
  })

  test('a hidden question is never required', () => {
    const q = parseQuestionnaire({
      steps: [
        {
          id: 'one',
          title: 'One',
          questions: [
            { id: 'pets', kind: 'single', prompt: 'Pets?', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }] },
            { id: 'pet_name', kind: 'short_text', prompt: 'Pet name', required: true, showIf: { field: 'pets', equals: 'yes' } },
          ],
        },
      ],
    })
    expect(allProblems(q, { pets: 'no' })).toEqual([])
    expect(ids(allProblems(q, { pets: 'yes' }))).toEqual(['pet_name'])
  })
})

describe('repeaters and pictures', () => {
  test('more cards than the limit is a problem, but empty cards do not count', () => {
    const people = (count: number, card: Record<string, string | number>) => Array.from({ length: count }, () => card)
    expect(ids(allProblems(questionnaire, { ...filledIn, people: people(13, { age: 30 }) }))).toEqual(['people'])
    expect(allProblems(questionnaire, { ...filledIn, people: people(12, { age: 30 }) })).toEqual([])
    expect(allProblems(questionnaire, { ...filledIn, people: [...people(12, { age: 30 }), { name: '' }] })).toEqual([])
  })

  test('the same picture as favourite and least favourite is a problem', () => {
    const same = { ...filledIn, style_sets: { kitchens: { favourite: 'a', least: 'a' } } }
    expect(allProblems(questionnaire, same)).toEqual([
      { stepId: 'style', questionId: 'style_sets', message: 'Pick a different least favourite in picture set 2' },
    ])
  })
})

describe('sample households', () => {
  for (const sample of loadSampleHouseholds()) {
    test(`${sample.label} has no problems`, () => {
      expect(allProblems(questionnaire, sample.answers)).toEqual([])
    })
  }
})
