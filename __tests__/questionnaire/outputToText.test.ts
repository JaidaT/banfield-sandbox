import { describe, expect, test } from 'vitest'
import { loadQuestionnaire, loadSampleHouseholds } from '@/lib/questionnaire/load'
import { buildOutput } from '@/lib/form/output'
import { outputToText } from '@/lib/questionnaire/outputToText'

const questionnaire = loadQuestionnaire()
const samples = Object.fromEntries(loadSampleHouseholds().map((s) => [s.id, s]))
const textFor = (id: string) => outputToText(buildOutput(questionnaire, samples[id].answers))

describe('outputToText', () => {
  test('starts with the name and the skipped steps', () => {
    const lines = textFor('furniture_couple').split('\n')
    expect(lines.slice(0, 2)).toEqual(['GET TO KNOW YOU: Ruth and Alan Example', 'Steps skipped: Kids, Pets'])
  })

  test('says so when no steps were skipped', () => {
    const lines = textFor('growing_family').split('\n')
    expect(lines.slice(0, 2)).toEqual(['GET TO KNOW YOU: Maya and Sam Example', 'Steps skipped: none'])
  })

  test('groups answers under step headings', () => {
    const text = textFor('furniture_couple')
    expect(text).toContain('CONTACT AND SITE\nYour name\n  Ruth and Alan Example')
    expect(text).toContain('THE PROJECT\nWhat are we working on?\n  Furniture and styling')
  })

  test('shows skipped questions and leaves out hidden ones', () => {
    const text = textFor('furniture_couple')
    expect(text).toContain('What do you love about it?\n  (skipped)')
    expect(text).not.toContain('Roughly how many square feet?')
  })

  test('shows each repeater card on one line', () => {
    expect(textFor('growing_family')).toContain(
      'Who lives here?\n  Card 1: Name: Maya / Age: 38 / What they do: Nurse\n  Card 2: Name: Sam',
    )
  })

  test('every sample comes out as plain ASCII', () => {
    for (const id of Object.keys(samples)) expect(textFor(id), id).toMatch(/^[\x09\x0A\x20-\x7E]*$/)
  })

  test("phones' curly quotes, long dashes and ... become plain, but accented names are kept", () => {
    const output = buildOutput(questionnaire, {
      name: 'René Example',
      love: '“The light” — and the kids’ room…',
    })
    const text = outputToText(output)
    expect(text).toContain('GET TO KNOW YOU: René Example')
    expect(text).toContain('  "The light" - and the kids\' room...')
  })
})
