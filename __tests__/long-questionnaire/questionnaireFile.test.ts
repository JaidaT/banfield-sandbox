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

  test('favourite travel places replaces favourite thing, and only shows for travellers', () => {
    expect(allQuestions.map((q) => q.id)).not.toContain('favourite_thing')
    const q = question('favourite_travel_places')
    expect(q.prompt).toBe("What are some of your favourite places you've travelled to?")
    expect(q.showIf).toEqual({ field: 'travels', equals: 'yes' })
  })

  test('mood words are the 14 from Banfield, in order', () => {
    expect(question('mood_words').options.map((o) => o.label)).toEqual([
      'Elegant', 'Formal', 'Casual', 'Relaxed', 'Contemporary', 'Sophisticated', 'Bright',
      'Welcoming', 'Warm', 'Cozy', 'Cool', 'Romantic', 'Timeless', 'Clean',
    ])
  })

  test('Wish list opens with flooring preferences, and Other brings up a text box', () => {
    const wishList = questionnaire.steps.find((s) => s.id === 'wish_list')!
    expect(wishList.questions[0].id).toBe('flooring')
    const q = question('flooring')
    expect(q.prompt).toBe('Are there any types of flooring you prefer?')
    expect(q.kind).toBe('multi')
    expect(q.options.map((o) => o.label)).toEqual([
      'Hardwood', 'Concrete', 'Tile', 'Carpet', 'Natural Stone', 'Cork', 'Vinyl', 'Other',
    ])
    expect(question('flooring_other').kind).toBe('short_text')
    expect(question('flooring_other').showIf).toEqual({ field: 'flooring', includes: 'other' })
  })

  test('Wish list asks about a favourite piece, (furniture or art wood), as a short answer after features', () => {
    const ids = questionnaire.steps.find((s) => s.id === 'wish_list')!.questions.map((q) => q.id)
    expect(ids.indexOf('favourite_piece')).toBe(ids.indexOf('features') + 1)
    const q = question('favourite_piece')
    expect(q.kind).toBe('short_text')
    expect(q.prompt).toBe('Do you have a favourite piece of furniture or art wood you absolutely love? Why do you love it?')
    expect(q.showIf).toBeUndefined()
  })

  test('Entertaining asks casual or formal, then why, after the get-together question', () => {
    const ids = questionnaire.steps.find((s) => s.id === 'entertaining')!.questions.map((q) => q.id)
    expect(ids.slice(0, 3)).toEqual(['gathering_types', 'hosting_style', 'hosting_style_why'])
    const q = question('hosting_style')
    expect(q.kind).toBe('single')
    expect(q.prompt).toBe('Are you more casual or formal?')
    expect(q.options.map((o) => o.label)).toEqual(['Casual', 'Formal'])
    const why = question('hosting_style_why')
    expect(why.kind).toBe('short_text')
    expect(why.prompt).toBe('And why?')
    expect(why.showIf).toBeUndefined()
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
    // The question is preferred_styles so it is not confused with the Style step.
    expect(allQuestions.map((q) => q.id)).not.toContain('style')
    const options = question('preferred_styles').options
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

  test('shared taste always shows, at the end of Working together, with its follow-up after it', () => {
    const working = questionnaire.steps.find((s) => s.id === 'working_together')!
    expect(working.questions.slice(-2).map((q) => q.id)).toEqual(['shared_taste', 'taste_differences'])
    expect(question('shared_taste').showIf).toBeUndefined()
    expect(question('taste_differences').showIf).toEqual({ field: 'shared_taste', in: ['meet_middle', 'not_close'] })
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
