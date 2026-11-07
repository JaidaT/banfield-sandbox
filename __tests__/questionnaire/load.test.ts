import { describe, expect, test } from 'vitest'
import { parseQuestionnaire } from '@/lib/questionnaire/load'

// A small valid questionnaire; each test changes one thing to break it.
function base() {
  return {
    steps: [
      {
        id: 'project',
        title: 'The project',
        questions: [
          {
            id: 'project_type',
            kind: 'single',
            prompt: 'What are we working on?',
            required: true,
            options: [
              { id: 'furniture_styling', label: 'Furniture and styling' },
              { id: 'renovation', label: 'A renovation' },
            ],
          },
          {
            id: 'square_feet',
            kind: 'number',
            prompt: 'Roughly how many square feet?',
            showIf: { field: 'project_type', equals: 'renovation' },
          },
        ],
      },
      {
        id: 'household',
        title: 'Household',
        questions: [
          {
            id: 'people',
            kind: 'repeater',
            prompt: 'Who lives here?',
            addLabel: 'Add a person',
            fields: [
              { id: 'name', kind: 'short_text', prompt: 'Name' },
              { id: 'age', kind: 'number', prompt: 'Age' },
            ],
          },
          { id: 'has_pets', kind: 'single', prompt: 'Any pets?', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }] },
        ],
      },
      {
        id: 'kids',
        title: 'Kids',
        showIf: { field: 'household_min_age', lessThan: 18 },
        questions: [{ id: 'kid_needs', kind: 'long_text', prompt: 'What do their spaces need?' }],
      },
      {
        id: 'style',
        title: 'Style by pictures',
        questions: [
          {
            id: 'style_sets',
            kind: 'pick_images',
            prompt: 'Pick a favourite and a least favourite',
            imageSets: [
              {
                id: 'set1',
                images: [
                  { id: 'a', label: 'Style A', src: '/questionnaire/set1-a.svg' },
                  { id: 'b', label: 'Style B', src: '/questionnaire/set1-b.svg' },
                ],
              },
            ],
          },
        ],
      },
    ],
  }
}

type Raw = ReturnType<typeof base>
// Returns a copy of the base questionnaire with `change` applied to it.
function withChange(change: (raw: Raw) => void): Raw {
  const raw = structuredClone(base())
  change(raw)
  return raw
}
const firstQuestion = (raw: Raw) => raw.steps[0].questions[0] as Record<string, unknown>
const secondQuestion = (raw: Raw) => raw.steps[0].questions[1] as Record<string, unknown>

describe('parseQuestionnaire: valid files', () => {
  test('accepts a valid questionnaire and defaults required to false', () => {
    const q = parseQuestionnaire(base())
    expect(q.steps.map((s) => s.id)).toEqual(['project', 'household', 'kids', 'style'])
    expect(q.steps[0].questions[0].required).toBe(true)
    expect(q.steps[0].questions[1].required).toBe(false)
    expect(q.steps[0].questions[1].showIf).toEqual({ field: 'project_type', equals: 'renovation' })
    expect(q.steps[1].questions[0].fields?.map((f) => f.id)).toEqual(['name', 'age'])
    expect(q.steps[1].questions[0].options).toEqual([])
  })

  test('keeps an optional picture on an answer option', () => {
    const raw = withChange((r) => {
      ;(firstQuestion(r).options as Record<string, unknown>[])[0].image = '/questionnaire/style-rustic.svg'
    })
    const options = parseQuestionnaire(raw).steps[0].questions[0].options
    expect(options[0].image).toBe('/questionnaire/style-rustic.svg')
    expect(options[1].image).toBeUndefined()
  })

  test('accepts atLeast on a number or derived value', () => {
    const raw = withChange((r) => {
      ;(r.steps[2] as Record<string, unknown>).showIf = { field: 'adult_count', atLeast: 2 }
    })
    expect(parseQuestionnaire(raw).steps[2].showIf).toEqual({ field: 'adult_count', atLeast: 2 })
  })

  test('accepts in, includes and any conditions', () => {
    const raw = withChange((r) => {
      r.steps[0].questions.push(
        {
          id: 'rooms',
          kind: 'multi',
          prompt: 'Which spaces?',
          options: [
            { id: 'kitchen', label: 'Kitchen' },
            { id: 'basement', label: 'Basement' },
          ],
        } as never,
        {
          id: 'kitchen_notes',
          kind: 'long_text',
          prompt: 'Kitchen notes',
          showIf: { any: [{ field: 'rooms', includes: 'kitchen' }, { field: 'project_type', equals: 'renovation' }] },
        } as never,
      )
    })
    const q = parseQuestionnaire(raw)
    expect(q.steps[0].questions[3].showIf).toEqual({
      any: [{ field: 'rooms', includes: 'kitchen' }, { field: 'project_type', equals: 'renovation' }],
    })
  })
})

describe('parseQuestionnaire: mistakes in the file', () => {
  test('throws when there is no steps list', () => {
    expect(() => parseQuestionnaire({})).toThrow(/steps/)
  })

  test('throws on a step without a title, and on duplicate step ids', () => {
    expect(() => parseQuestionnaire(withChange((r) => { r.steps[0].title = '' }))).toThrow(/project.*title/)
    expect(() => parseQuestionnaire(withChange((r) => { r.steps[1].id = 'project' }))).toThrow(/duplicate step.*project/i)
  })

  test('throws on duplicate question ids anywhere in the questionnaire', () => {
    const raw = withChange((r) => { r.steps[2].questions[0].id = 'project_type' })
    expect(() => parseQuestionnaire(raw)).toThrow(/duplicate question.*project_type/i)
  })

  test('throws on an unknown kind or a missing prompt', () => {
    expect(() => parseQuestionnaire(withChange((r) => { firstQuestion(r).kind = 'slider' }))).toThrow(/project_type.*slider/)
    // "date" was removed 2026-11-07 because no question used it.
    expect(() => parseQuestionnaire(withChange((r) => { secondQuestion(r).kind = 'date' }))).toThrow(/square_feet.*unknown kind: date/)
    expect(() => parseQuestionnaire(withChange((r) => { firstQuestion(r).prompt = '' }))).toThrow(/project_type.*prompt/)
  })

  test('throws when required is not true or false', () => {
    expect(() => parseQuestionnaire(withChange((r) => { firstQuestion(r).required = 'yes' }))).toThrow(/project_type.*required/)
  })

  test('throws on a choice question with no options, or duplicate option ids', () => {
    expect(() => parseQuestionnaire(withChange((r) => { firstQuestion(r).options = [] }))).toThrow(/project_type.*option/)
    const dup = withChange((r) => {
      firstQuestion(r).options = [{ id: 'a', label: 'A' }, { id: 'a', label: 'Also A' }]
    })
    expect(() => parseQuestionnaire(dup)).toThrow(/project_type.*duplicate.*a/i)
  })

  // Removed 2026-11-06 (see DECISIONS.md): put the rule on the question instead.
  test('throws on a rule on a single answer choice', () => {
    const raw = withChange((r) => {
      ;(firstQuestion(r).options as Record<string, unknown>[])[1].showIf = { field: 'project_type', equals: 'renovation' }
    })
    expect(() => parseQuestionnaire(raw)).toThrow(/project_type.*renovation.*answer choices are not supported/)
  })

  test('throws on an option picture that is not a path', () => {
    const raw = withChange((r) => {
      ;(firstQuestion(r).options as Record<string, unknown>[])[0].image = ''
    })
    expect(() => parseQuestionnaire(raw)).toThrow(/project_type.*furniture_styling.*image/)
  })

  test('throws on a repeater without fields, inside another repeater, or with a bad max', () => {
    const people = (r: Raw) => r.steps[1].questions[0] as Record<string, unknown>
    expect(() => parseQuestionnaire(withChange((r) => { people(r).fields = [] }))).toThrow(/people.*fields/)
    const nested = withChange((r) => {
      people(r).fields = [{ id: 'pets', kind: 'repeater', prompt: 'Pets', fields: [{ id: 'n', kind: 'short_text', prompt: 'N' }] }]
    })
    expect(() => parseQuestionnaire(nested)).toThrow(/people.*repeater inside/i)
    expect(() => parseQuestionnaire(withChange((r) => { people(r).max = 0 }))).toThrow(/people.*max/)
  })

  test('throws on rules inside a repeater card (not supported yet)', () => {
    const raw = withChange((r) => {
      const people = r.steps[1].questions[0] as { fields: Record<string, unknown>[] }
      people.fields[1].showIf = { field: 'project_type', equals: 'renovation' }
    })
    expect(() => parseQuestionnaire(raw)).toThrow(/people.*age.*not supported/i)
  })

  test('throws on an image set with fewer than 2 images, or a missing picture', () => {
    const sets = (r: Raw) => (r.steps[3].questions[0] as { imageSets: { images: Record<string, unknown>[] }[] }).imageSets
    expect(() => parseQuestionnaire(withChange((r) => { sets(r)[0].images.pop() }))).toThrow(/style_sets.*set1.*2/)
    expect(() => parseQuestionnaire(withChange((r) => { sets(r)[0].images[0].src = '' }))).toThrow(/style_sets.*a.*src/)
  })
})

describe('parseQuestionnaire: mistakes in rules', () => {
  test('throws when a rule names a question that does not exist or comes later', () => {
    const missing = withChange((r) => { secondQuestion(r).showIf = { field: 'nope', equals: 'x' } })
    expect(() => parseQuestionnaire(missing)).toThrow(/square_feet.*nope/)
    const later = withChange((r) => { secondQuestion(r).showIf = { field: 'has_pets', equals: 'yes' } })
    expect(() => parseQuestionnaire(later)).toThrow(/square_feet.*has_pets.*later/)
  })

  test('throws when a rule names an answer that does not exist', () => {
    const raw = withChange((r) => { secondQuestion(r).showIf = { field: 'project_type', equals: 'castle' } })
    expect(() => parseQuestionnaire(raw)).toThrow(/square_feet.*castle/)
    const inList = withChange((r) => { secondQuestion(r).showIf = { field: 'project_type', in: ['renovation', 'castle'] } })
    expect(() => parseQuestionnaire(inList)).toThrow(/square_feet.*castle/)
  })

  test('throws when a rule does not fit its question', () => {
    const lessThanOnChoice = withChange((r) => { secondQuestion(r).showIf = { field: 'project_type', lessThan: 3 } })
    expect(() => parseQuestionnaire(lessThanOnChoice)).toThrow(/square_feet.*lessThan.*project_type/)
    const atLeastOnChoice = withChange((r) => { secondQuestion(r).showIf = { field: 'project_type', atLeast: 2 } })
    expect(() => parseQuestionnaire(atLeastOnChoice)).toThrow(/square_feet.*atLeast.*project_type/)
    const onText = withChange((r) => {
      ;(r.steps[3] as Record<string, unknown>).showIf = { field: 'kid_needs', equals: 'x' }
    })
    expect(() => parseQuestionnaire(onText)).toThrow(/style.*kid_needs/)
  })

  test('throws on a rule with no operator, two operators, or nested any/all', () => {
    const none = withChange((r) => { secondQuestion(r).showIf = { field: 'project_type' } })
    expect(() => parseQuestionnaire(none)).toThrow(/square_feet.*one of/)
    const two = withChange((r) => { secondQuestion(r).showIf = { field: 'project_type', equals: 'renovation', in: ['renovation'] } })
    expect(() => parseQuestionnaire(two)).toThrow(/square_feet.*one of/)
    const nested = withChange((r) => {
      secondQuestion(r).showIf = { any: [{ any: [{ field: 'project_type', equals: 'renovation' }] }] }
    })
    expect(() => parseQuestionnaire(nested)).toThrow(/square_feet.*nested/)
  })

  // Removed 2026-11-07 because no rule used it (see DECISIONS.md).
  test('throws on an "all" rule', () => {
    const raw = withChange((r) => {
      secondQuestion(r).showIf = { all: [{ field: 'project_type', equals: 'renovation' }] }
    })
    expect(() => parseQuestionnaire(raw)).toThrow(/square_feet.*"all".*not supported/)
  })

  test('throws on an unknown derived value', () => {
    const raw = withChange((r) => {
      ;(r.steps[2] as Record<string, unknown>).showIf = { field: 'household_max_age', lessThan: 18 }
    })
    expect(() => parseQuestionnaire(raw)).toThrow(/kids.*household_max_age/)
  })
})
