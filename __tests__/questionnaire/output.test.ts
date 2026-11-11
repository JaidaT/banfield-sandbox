import { describe, expect, test } from 'vitest'
import { loadQuestionnaire, loadSampleHouseholds } from '@/lib/questionnaire/load'
import { parseQuestionnaire } from '@/lib/form/parse'
import { buildOutput, contactName } from '@/lib/form/output'
import type { Answers } from '@/lib/form/types'
import type { OutputAnswer, QuestionnaireOutput } from '@/lib/form/output'

const questionnaire = loadQuestionnaire()
const samples = Object.fromEntries(loadSampleHouseholds().map((s) => [s.id, s]))
const find = (output: QuestionnaireOutput, id: string): OutputAnswer | undefined =>
  output.steps.flatMap((s) => s.answers).find((a) => a.id === id)

describe('buildOutput', () => {
  test('groups answers by visible step, with the words people saw', () => {
    const output = buildOutput(questionnaire, samples.growing_family.answers)
    expect(output.steps.map((s) => s.id)).toEqual(samples.growing_family.expectedSteps.filter((id) => id !== 'welcome'))
    expect(output.skippedSteps).toEqual([])
    expect(find(output, 'project_type')).toEqual({
      id: 'project_type',
      prompt: 'What are we working on?',
      status: 'answered',
      value: 'Renovation',
    })
    expect(find(output, 'spaces')?.value).toBe('Kitchen, Living room, Bedroom, Basement')
    expect(find(output, 'square_feet')?.value).toBe('2400')
  })

  test('slider answers are in words: money, "+" at the top, a plain number, or the choice label', () => {
    // The real questionnaire has no slider yet, so this uses a small one.
    const sliders = parseQuestionnaire({
      steps: [
        {
          id: 'money',
          title: 'Money',
          questions: [
            {
              id: 'investment',
              kind: 'range',
              prompt: 'Investment?',
              min: 0,
              max: 500000,
              step: 10000,
              format: 'money',
              options: [{ id: 'not_sure', label: 'Not sure yet' }],
            },
            { id: 'rooms', kind: 'range', prompt: 'Rooms?', min: 1, max: 10, step: 1 },
          ],
        },
      ],
    })
    const valueOf = (answers: Answers, id: string) => find(buildOutput(sliders, answers), id)?.value
    expect(valueOf({ investment: 200000 }, 'investment')).toBe('$200K')
    expect(valueOf({ investment: 500000 }, 'investment')).toBe('$500K+')
    expect(valueOf({ investment: 0 }, 'investment')).toBe('$0')
    expect(valueOf({ investment: 'not_sure' }, 'investment')).toBe('Not sure yet')
    expect(valueOf({ rooms: 4 }, 'rooms')).toBe('4')
    expect(find(buildOutput(sliders, {}), 'investment')?.status).toBe('skipped')
  })

  test('repeater cards list each field by its prompt', () => {
    const output = buildOutput(questionnaire, samples.growing_family.answers)
    expect(find(output, 'people')?.cards?.[0]).toEqual([
      { label: 'Name', value: 'Maya' },
      { label: 'Age', value: '38' },
      { label: 'What they do', value: 'Nurse' },
    ])
    expect(find(output, 'kids')?.cards?.[1]).toEqual([
      { label: 'Name', value: 'Theo' },
      { label: 'What are they into?', value: 'Sports, Building and making' },
      { label: 'What does their space need?', value: 'Floor space for Lego.' },
    ])
  })

  test('picture picks name each set and picture', () => {
    const output = buildOutput(questionnaire, samples.growing_family.answers)
    expect(find(output, 'style_sets')?.value).toBe(
      'Picture set 1: favourite Living room B, least favourite Living room D. ' +
        'Picture set 2: favourite Kitchen A, least favourite Kitchen C',
    )
  })

  test('marks hidden and skipped questions differently, and lists skipped steps', () => {
    const output = buildOutput(questionnaire, samples.furniture_couple.answers)
    expect(output.skippedSteps).toEqual(['Kids', 'Pets'])
    expect(find(output, 'square_feet')).toEqual({ id: 'square_feet', prompt: 'Roughly how many square feet?', status: 'hidden' })
    expect(find(output, 'love')).toEqual({ id: 'love', prompt: 'What do you love about it?', status: 'skipped' })
  })

  test('hidden answers are left out, and come back if the person switches back', () => {
    const answers: Answers = { ...samples.growing_family.answers, has_pets: 'no' }
    const without = buildOutput(questionnaire, answers)
    expect(without.steps.map((s) => s.id)).not.toContain('pets')
    expect(without.skippedSteps).toEqual(['Pets'])
    // The pet card says "Golden retriever" (the dog's name also appears in "Anything else?").
    expect(JSON.stringify(without)).not.toContain('Golden retriever')

    const back = buildOutput(questionnaire, { ...answers, has_pets: 'yes' })
    expect(JSON.stringify(back)).toContain('Golden retriever')
  })

  test('empty cards are dropped, and a repeater with only empty cards is skipped', () => {
    const some = buildOutput(questionnaire, { people: [{ name: '' }, { name: 'Pat', age: 30 }] })
    expect(find(some, 'people')?.cards).toEqual([[{ label: 'Name', value: 'Pat' }, { label: 'Age', value: '30' }]])
    const none = buildOutput(questionnaire, { people: [{ name: '', occupation: ' ' }] })
    expect(find(none, 'people')).toEqual({ id: 'people', prompt: 'Who lives here?', status: 'skipped' })
  })

  test('contactName finds the name from the contact step, or nothing if skipped', () => {
    expect(contactName(buildOutput(questionnaire, { name: 'Pat Example' }))).toBe('Pat Example')
    expect(contactName(buildOutput(questionnaire, {}))).toBeUndefined()
  })

  test('the welcome step is left out because it has no questions', () => {
    expect(buildOutput(questionnaire, {}).steps.map((s) => s.id)).not.toContain('welcome')
  })
})
