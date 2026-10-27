import archetypesJson from '@/data/archetypes.json'
import questionsJson from '@/data/questions.json'
import signalsJson from '@/data/signals.json'
import { COMPARISONS, QUESTION_KINDS, SIGNALS } from './types'
import type {
  AnswerOption,
  Archetype,
  ArchetypeData,
  Comparison,
  Question,
  QuestionKind,
  Signal,
  SignalRule,
  Weights,
} from './types'

const STRING_FIELDS = ['id', 'label', 'communication', 'pacing', 'pitch'] as const
const ARRAY_FIELDS = ['segments', 'signals', 'risks'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Validates untrusted JSON so a bad edit to the data file fails loudly
// instead of producing a brief with missing guidance.
export function parseArchetypes(raw: unknown): Archetype[] {
  if (!isRecord(raw) || !Array.isArray(raw.archetypes) || !isRecord(raw.segments)) {
    throw new Error('archetypes data must have an "archetypes" array and a "segments" object')
  }
  const segments = raw.segments
  const seen = new Set<string>()

  return raw.archetypes.map((entry: unknown, index: number): Archetype => {
    if (!isRecord(entry)) throw new Error(`archetype at index ${index} is not an object`)
    const name = typeof entry.id === 'string' ? entry.id : `index ${index}`

    for (const field of STRING_FIELDS) {
      if (typeof entry[field] !== 'string' || entry[field] === '') {
        throw new Error(`archetype ${name} is missing "${field}"`)
      }
    }
    for (const field of ARRAY_FIELDS) {
      if (!Array.isArray(entry[field])) throw new Error(`archetype ${name} is missing "${field}"`)
    }
    if ((entry.risks as unknown[]).length === 0) {
      throw new Error(`archetype ${name} must list at least one risk`)
    }
    if (seen.has(name)) throw new Error(`duplicate archetype id: ${name}`)
    seen.add(name)

    for (const segment of entry.segments as unknown[]) {
      if (typeof segment !== 'string' || !(segment in segments)) {
        throw new Error(`archetype ${name} references unknown segment: ${String(segment)}`)
      }
    }

    return {
      id: name,
      label: entry.label as string,
      tagline: typeof entry.tagline === 'string' ? entry.tagline : '',
      description: typeof entry.description === 'string' ? entry.description : '',
      segments: entry.segments as string[],
      signals: entry.signals as string[],
      communication: entry.communication as string,
      pacing: entry.pacing as string,
      pitch: entry.pitch as string,
      risks: entry.risks as string[],
      brief_tips: typeof entry.brief_tips === 'string' ? entry.brief_tips : '',
    }
  })
}

export function loadArchetypes(): Archetype[] {
  return parseArchetypes(archetypesJson as unknown)
}

export function loadSegments(): ArchetypeData['segments'] {
  return (archetypesJson as unknown as ArchetypeData).segments
}

function parseOption(raw: unknown, questionId: string, archetypeIds: Set<string>): AnswerOption {
  if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.label !== 'string') {
    throw new Error(`question ${questionId} has an option without an "id" and "label"`)
  }
  const weights = parseWeights(raw.weights, `question ${questionId} option ${raw.id}`, archetypeIds)
  return { id: raw.id, label: raw.label, weights }
}

// Validates the question bank against the known archetype ids, so a typo in a
// weight key fails here instead of silently skewing every score.
export function parseQuestionBank(raw: unknown, archetypeIds: readonly string[]): Question[] {
  if (!isRecord(raw) || !Array.isArray(raw.questions)) {
    throw new Error('question bank must have a "questions" array')
  }
  const known = new Set(archetypeIds)
  const seen = new Set<string>()

  return raw.questions.map((entry: unknown, index: number): Question => {
    if (!isRecord(entry) || typeof entry.id !== 'string' || entry.id === '') {
      throw new Error(`question at index ${index} is missing an "id"`)
    }
    const id = entry.id
    if (seen.has(id)) throw new Error(`duplicate question id: ${id}`)
    seen.add(id)

    if (!QUESTION_KINDS.includes(entry.kind as QuestionKind)) {
      throw new Error(`question ${id} has unknown kind: ${String(entry.kind)}`)
    }
    const kind = entry.kind as QuestionKind
    if (typeof entry.prompt !== 'string' || entry.prompt === '') {
      throw new Error(`question ${id} is missing a "prompt"`)
    }

    const rawOptions = entry.options === undefined ? [] : entry.options
    if (!Array.isArray(rawOptions)) throw new Error(`question ${id} has "options" that is not a list`)
    if (kind !== 'text' && rawOptions.length === 0) {
      throw new Error(`question ${id} is a choice question with no options`)
    }
    const options = rawOptions.map((o: unknown) => parseOption(o, id, known))
    const optionIds = new Set<string>()
    for (const o of options) {
      if (optionIds.has(o.id)) throw new Error(`question ${id} has duplicate option id: ${o.id}`)
      optionIds.add(o.id)
    }

    const question: Question = {
      id,
      kind,
      prompt: entry.prompt,
      optional: entry.optional === true,
      options,
    }
    if (typeof entry.help === 'string') question.help = entry.help
    if (typeof entry.criterion === 'string') question.criterion = entry.criterion
    if (kind === 'multi' && typeof entry.maxSelections === 'number') {
      question.maxSelections = entry.maxSelections
    }
    return question
  })
}

export function loadQuestions(): Question[] {
  return parseQuestionBank(
    questionsJson as unknown,
    loadArchetypes().map((a) => a.id),
  )
}

// `where` names the owner (e.g. "signal rule fast") so errors point at the bad entry.
function parseWeights(raw: unknown, where: string, archetypeIds: Set<string>): Weights {
  const weights: Weights = {}
  if (raw === undefined) return weights
  if (!isRecord(raw)) throw new Error(`${where} has "weights" that is not an object`)
  for (const [archetypeId, weight] of Object.entries(raw)) {
    if (!archetypeIds.has(archetypeId)) {
      throw new Error(`${where} weights unknown archetype: ${archetypeId}`)
    }
    if (typeof weight !== 'number' || !Number.isFinite(weight)) {
      throw new Error(`${where} weight for ${archetypeId} must be a number`)
    }
    weights[archetypeId] = weight
  }
  return weights
}

export function parseSignalRules(raw: unknown, archetypeIds: readonly string[]): SignalRule[] {
  if (!isRecord(raw) || !Array.isArray(raw.rules)) {
    throw new Error('signal rules must have a "rules" array')
  }
  const known = new Set(archetypeIds)
  const seen = new Set<string>()

  return raw.rules.map((entry: unknown, index: number): SignalRule => {
    if (!isRecord(entry) || typeof entry.id !== 'string' || entry.id === '') {
      throw new Error(`signal rule at index ${index} is missing an "id"`)
    }
    const id = entry.id
    if (seen.has(id)) throw new Error(`duplicate signal rule id: ${id}`)
    seen.add(id)

    if (!SIGNALS.includes(entry.signal as Signal)) {
      throw new Error(`signal rule ${id} has unknown signal: ${String(entry.signal)}`)
    }
    if (!COMPARISONS.includes(entry.op as Comparison)) {
      throw new Error(`signal rule ${id} has unknown comparison: ${String(entry.op)}`)
    }
    if (typeof entry.value !== 'number' || !Number.isFinite(entry.value)) {
      throw new Error(`signal rule ${id} "value" must be a number`)
    }
    if (typeof entry.note !== 'string' || entry.note === '') {
      throw new Error(`signal rule ${id} is missing a "note" for the team brief`)
    }

    return {
      id,
      signal: entry.signal as Signal,
      op: entry.op as Comparison,
      value: entry.value,
      weights: parseWeights(entry.weights, `signal rule ${id}`, known),
      note: entry.note,
    }
  })
}

export function loadSignalRules(): SignalRule[] {
  return parseSignalRules(
    signalsJson as unknown,
    loadArchetypes().map((a) => a.id),
  )
}
