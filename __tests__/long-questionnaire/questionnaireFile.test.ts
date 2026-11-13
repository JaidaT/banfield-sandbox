import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { loadQuestionnaire } from '@/lib/long-questionnaire/load'

// Checks on the real data/long-questionnaire/questionnaire.json (the draft wording).
describe('questionnaire.json', () => {
  const questionnaire = loadQuestionnaire()
  const allQuestions = questionnaire.steps.flatMap((s) => s.questions)
  const question = (id: string) => {
    const found = allQuestions.find((q) => q.id === id)
    if (!found) throw new Error(`no question ${id}`)
    return found
  }

  test('loads with the steps from the step map, in order (the review step is built by the screens)', () => {
    expect(questionnaire.steps.map((s) => s.id)).toEqual([
      'welcome',
      'contact',
      'project',
      'investment',
      'working_together',
      'household',
      'kids',
      'pets',
      'everyday',
      'entertaining',
      'travel',
      'home_words',
      'style',
      'wish_list',
    ])
  })

  test('only contact details and project type are required', () => {
    const required = allQuestions.filter((q) => q.required).map((q) => q.id)
    expect(required).toEqual(['name', 'email', 'phone', 'project_type'])
  })

  test('Household asks a simple Yes/No about daytime sleepers', () => {
    const household = questionnaire.steps.find((s) => s.id === 'household')!
    const q = question('has_day_sleepers')
    expect(household.questions).toContain(q)
    expect(q.prompt).toBe('Any daytime sleepers living here?')
    expect(q.kind).toBe('single')
    expect(q.options.map((o) => o.label)).toEqual(['Yes', 'No'])
    expect(q.showIf).toBeUndefined()
    // Not asked twice: the old tick box under "design around" is gone.
    expect(question('considerations').options.map((o) => o.id)).not.toContain('day_sleeper')
  })

  test('"Where do meals happen?" offers counter, table, family room or Other', () => {
    expect(question('meals').options.map((o) => [o.id, o.label])).toEqual([
      ['kitchen_counter', 'Kitchen counter'],
      ['dining_table', 'Dining table'],
      ['family_room', 'Family room'],
      ['other', 'Other'],
    ])
    expect(question('meals_other').kind).toBe('short_text')
    expect(question('meals_other').showIf).toEqual({ field: 'meals', equals: 'other' })
  })

  test('get-together types include Catered events', () => {
    expect(question('gathering_types').options.map((o) => o.label)).toContain('Catered events')
  })

  test('project types match the current form plus furniture and facelift', () => {
    expect(question('project_type').options.map((o) => o.label)).toEqual([
      'Furniture and styling',
      'Facelift (paint, flooring)',
      'Renovation',
      'Addition',
      'New build',
    ])
  })

  test('the style question uses the current form list, each with a picture', () => {
    const options = question('style').options
    expect(options.map((o) => o.label)).toEqual([
      'Contemporary Rustic',
      'Old World Elegant',
      'Tuscan Traditional',
      'Minimalistic / Clean',
      'Modern Country',
      'Sophisticated Glam',
      'Eclectic / Collected',
      'Traditional',
      'French / Parisian',
    ])
    for (const o of options) expect(o.image, o.id).toMatch(/^\/questionnaire\/.+\.svg$/)
  })

  test('the big branches skip whole steps', () => {
    const step = (id: string) => questionnaire.steps.find((s) => s.id === id)?.showIf
    expect(step('kids')).toEqual({
      any: [
        { field: 'has_kids', equals: 'yes' },
        { field: 'household_min_age', lessThan: 18 },
      ],
    })
    expect(step('pets')).toEqual({ field: 'has_pets', equals: 'yes' })
    // Only "Never" skips Entertaining.
    expect(step('entertaining')).toEqual({
      field: 'hosting_frequency',
      in: ['rarely', 'few_times_year', 'monthly', 'all_the_time'],
    })
  })

  test('shared taste only shows for 2 or more adults', () => {
    expect(question('shared_taste').showIf).toEqual({ field: 'adult_count', atLeast: 2 })
  })

  test('every picture named in the file exists in public/', () => {
    const paths = allQuestions.flatMap((q) => [
      ...q.options.flatMap((o) => (o.image ? [o.image] : [])),
      ...(q.imageSets ?? []).flatMap((set) => set.images.map((img) => img.src)),
    ])
    expect(paths.length).toBe(17)
    for (const p of paths) expect(existsSync(join(process.cwd(), 'public', p)), p).toBe(true)
  })

  test('text has no special characters (plain ASCII only)', () => {
    const text = JSON.stringify(questionnaire)
    expect(text).toMatch(/^[\x20-\x7E]*$/)
  })
})
