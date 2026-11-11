import { describe, expect, test } from 'vitest'
import { loadQuestionnaire, loadSampleHouseholds } from '@/lib/long-questionnaire/load'
import { longQuestionnaireRows } from '@/lib/long-questionnaire/sampleList'

const rows = longQuestionnaireRows()
const row = (id: string) => rows.find((r) => r.id === id)!

describe('longQuestionnaireRows', () => {
  test('one row per household, newest first', () => {
    expect(rows.map((r) => r.id)).toEqual(['growing_family', 'furniture_couple', 'solo_new_build', 'multi_generational'])
    expect(rows[0].date).toBe('Nov 8, 2026')
  })

  test('the name is the contact name the household gave', () => {
    expect(row('furniture_couple').name).toBe('Ruth and Alan Example')
  })

  test('the project type in words, as the household answered it', () => {
    expect(row('growing_family').projectType).toBe('Renovation')
    expect(row('furniture_couple').projectType).toBe('Furniture and styling')
    expect(row('multi_generational').projectType).toBe('Addition')
  })

  test('steps skipped, or "none"', () => {
    expect(row('furniture_couple').stepsSkipped).toBe('Kids, Pets')
    expect(row('growing_family').stepsSkipped).toBe('none')
  })

  test('each row keeps its label and test note', () => {
    for (const s of loadSampleHouseholds()) {
      expect(row(s.id).label).toBe(s.label)
      expect(row(s.id).note).toBe(s.note)
    }
  })

  test('a household that skipped the name and project type reads "Not given"', () => {
    const [first] = loadSampleHouseholds()
    const { name: _name, project_type: _type, ...rest } = first.answers
    void _name
    void _type
    const [blank] = longQuestionnaireRows([{ ...first, answers: rest }], loadQuestionnaire())
    expect(blank.name).toBe(first.label)
    expect(blank.projectType).toBe('Not given')
  })
})
