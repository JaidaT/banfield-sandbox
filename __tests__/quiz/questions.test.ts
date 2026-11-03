import { describe, expect, test } from 'vitest'
import { loadArchetypes, loadQuestions, parseQuestionBank } from '@/lib/quiz/load'

const IDS = ['decisive_delegator', 'analytical_validator']

function bankWith(questions: unknown[]) {
  return { questions }
}

describe('loadQuestions', () => {
  test('loads the question bank from data/questions.json', () => {
    expect(loadQuestions().length).toBeGreaterThan(0)
  })

  test('every archetype can be scored by at least one answer option', () => {
    const weighted = new Set(
      loadQuestions().flatMap((q) => q.options.flatMap((o) => Object.keys(o.weights))),
    )
    for (const a of loadArchetypes()) {
      expect(weighted, `no answer option scores ${a.id}`).toContain(a.id)
    }
  })

  test('client-facing text never mentions an archetype id or label', () => {
    const archetypes = loadArchetypes()
    for (const q of loadQuestions()) {
      const texts = [q.prompt, ...q.options.map((o) => o.label)]
      for (const text of texts) {
        for (const a of archetypes) {
          expect(text.toLowerCase()).not.toContain(a.id)
          expect(text.toLowerCase()).not.toContain(a.label.replace(/^the /i, '').toLowerCase())
        }
      }
    }
  })
})

describe('parseQuestionBank', () => {
  test('accepts a valid single-choice question', () => {
    const bank = bankWith([
      {
        id: 'q1',
        kind: 'single',
        prompt: 'Pick one',
        options: [{ id: 'a', label: 'A', weights: { decisive_delegator: 2 } }],
      },
    ])
    const [q] = parseQuestionBank(bank, IDS)
    expect(q.options[0].weights).toEqual({ decisive_delegator: 2 })
  })

  test('throws when an answer weight uses an unknown archetype id', () => {
    const bank = bankWith([
      {
        id: 'q1',
        kind: 'single',
        prompt: 'Pick one',
        options: [{ id: 'a', label: 'A', weights: { not_real: 2 } }],
      },
    ])
    expect(() => parseQuestionBank(bank, IDS)).toThrow(/q1.*not_real/)
  })

  test('throws when a weight is not a number', () => {
    const bank = bankWith([
      {
        id: 'q1',
        kind: 'single',
        prompt: 'Pick one',
        options: [{ id: 'a', label: 'A', weights: { decisive_delegator: 'lots' } }],
      },
    ])
    expect(() => parseQuestionBank(bank, IDS)).toThrow(/q1.*decisive_delegator/)
  })

  test('throws on duplicate question ids', () => {
    const q = { id: 'dup', kind: 'text', prompt: 'Tell us' }
    expect(() => parseQuestionBank(bankWith([q, q]), IDS)).toThrow(/duplicate.*dup/i)
  })

  test('throws on duplicate option ids within a question', () => {
    const bank = bankWith([
      {
        id: 'q1',
        kind: 'single',
        prompt: 'Pick one',
        options: [
          { id: 'a', label: 'A' },
          { id: 'a', label: 'Also A' },
        ],
      },
    ])
    expect(() => parseQuestionBank(bank, IDS)).toThrow(/q1.*duplicate.*a/i)
  })

  test('throws when a choice question has no options', () => {
    const bank = bankWith([{ id: 'q1', kind: 'single', prompt: 'Pick one', options: [] }])
    expect(() => parseQuestionBank(bank, IDS)).toThrow(/q1.*option/)
  })

  test('throws on an unknown question kind', () => {
    const bank = bankWith([{ id: 'q1', kind: 'slider', prompt: 'Slide' }])
    expect(() => parseQuestionBank(bank, IDS)).toThrow(/q1.*slider/)
  })

  // Fit and archetype are independent axes (see DECISIONS.md).
  test('throws when a fit question carries archetype weights', () => {
    const bank = bankWith([
      {
        id: 'timeframe',
        kind: 'single',
        prompt: 'When?',
        criterion: 'timeframe',
        options: [{ id: 'soon', label: 'Soon', weights: { decisive_delegator: 1 } }],
      },
    ])
    expect(() => parseQuestionBank(bank, IDS)).toThrow(/timeframe.*fit.*weights/)
  })

  test('text questions need no options and default to an empty list', () => {
    const [q] = parseQuestionBank(bankWith([{ id: 'home', kind: 'text', prompt: 'Tell us' }]), IDS)
    expect(q.options).toEqual([])
  })

  test('keeps ignoreIfSkipped when set, and leaves it off otherwise', () => {
    const [extra, home] = parseQuestionBank(
      bankWith([
        { id: 'extra', kind: 'text', prompt: 'Anything else?', ignoreIfSkipped: true },
        { id: 'home', kind: 'text', prompt: 'Tell us' },
      ]),
      IDS,
    )
    expect(extra.ignoreIfSkipped).toBe(true)
    expect(home.ignoreIfSkipped).toBeUndefined()
  })

  test('throws when ignoreIfSkipped is not true or false', () => {
    const bank = bankWith([{ id: 'extra', kind: 'text', prompt: 'Anything else?', ignoreIfSkipped: 'yes' }])
    expect(() => parseQuestionBank(bank, IDS)).toThrow(/extra.*ignoreIfSkipped/)
  })
})

describe('parseQuestionBank: range (slider) questions', () => {
  function slider(overrides: Record<string, unknown> = {}) {
    return bankWith([
      {
        id: 'budget',
        kind: 'range',
        prompt: 'How much?',
        min: 0,
        max: 500000,
        step: 10000,
        options: [{ id: 'not_sure', label: 'Not sure yet' }],
        ...overrides,
      },
    ])
  }

  test('accepts a valid slider and keeps min, max, step and the escape option', () => {
    const [q] = parseQuestionBank(slider(), IDS)
    expect(q.kind).toBe('range')
    expect([q.min, q.max, q.step]).toEqual([0, 500000, 10000])
    expect(q.options.map((o) => o.id)).toEqual(['not_sure'])
  })

  test('the escape option is optional', () => {
    const [q] = parseQuestionBank(slider({ options: undefined }), IDS)
    expect(q.options).toEqual([])
  })

  test('throws when min, max or step is missing or not a number', () => {
    expect(() => parseQuestionBank(slider({ min: undefined }), IDS)).toThrow(/budget.*min/)
    expect(() => parseQuestionBank(slider({ max: '500K' }), IDS)).toThrow(/budget.*max/)
    expect(() => parseQuestionBank(slider({ step: undefined }), IDS)).toThrow(/budget.*step/)
  })

  test('throws when min is not below max', () => {
    expect(() => parseQuestionBank(slider({ min: 500000 }), IDS)).toThrow(/budget.*min.*max/)
  })

  test('throws when step is zero or negative', () => {
    expect(() => parseQuestionBank(slider({ step: 0 }), IDS)).toThrow(/budget.*step/)
    expect(() => parseQuestionBank(slider({ step: -5 }), IDS)).toThrow(/budget.*step/)
  })

  test('throws when the slider cannot land exactly on max', () => {
    expect(() => parseQuestionBank(slider({ step: 30000 }), IDS)).toThrow(/budget.*step/)
  })
})
