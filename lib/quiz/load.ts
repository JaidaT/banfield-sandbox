import archetypesJson from '@/data/archetypes.json'
import clientResultJson from '@/data/client-result.json'
import leadRulesJson from '@/data/lead-rules.json'
import questionsJson from '@/data/questions.json'
import samplesJson from '@/data/sample-submissions.json'
import signalsJson from '@/data/signals.json'
import { validateSubmission } from './submission'
import { COMPARISONS, LEAD_TEMPERATURES, QUESTION_KINDS, SIGNALS } from './types'
import type {
  AnswerOption,
  Archetype,
  ArchetypeData,
  ClientCopy,
  Comparison,
  WarningCondition,
  LeadDetailRule,
  LeadRules,
  LeadTemperature,
  ProjectThresholds,
  WarningSign,
  Question,
  QuestionKind,
  QuizData,
  SampleSubmission,
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

// A slider must be able to move from min to exactly max in whole steps.
function parseRange(entry: Record<string, unknown>, id: string): { min: number; max: number; step: number } {
  for (const field of ['min', 'max', 'step'] as const) {
    if (typeof entry[field] !== 'number' || !Number.isFinite(entry[field])) {
      throw new Error(`question ${id} is a range question and needs a number for "${field}"`)
    }
  }
  const min = entry.min as number
  const max = entry.max as number
  const step = entry.step as number
  if (min >= max) throw new Error(`question ${id} needs "min" (${min}) to be below "max" (${max})`)
  if (step <= 0) throw new Error(`question ${id} needs a "step" above 0`)
  if (!Number.isInteger((max - min) / step)) {
    throw new Error(`question ${id} "step" (${step}) must divide evenly from ${min} to ${max}`)
  }
  return { min, max, step }
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
    // Range questions need no options; any they have are escapes like "Not sure yet".
    if ((kind === 'single' || kind === 'multi') && rawOptions.length === 0) {
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
    if (entry.ignoreIfSkipped !== undefined) {
      if (typeof entry.ignoreIfSkipped !== 'boolean') {
        throw new Error(`question ${id} "ignoreIfSkipped" must be true or false`)
      }
      if (entry.ignoreIfSkipped) question.ignoreIfSkipped = true
    }
    if (kind === 'range') Object.assign(question, parseRange(entry, id))
    if (typeof entry.criterion === 'string') {
      question.criterion = entry.criterion
      // Fit and archetype are independent axes, so fit answers never score archetypes.
      const weighted = options.find((o) => Object.keys(o.weights).length > 0)
      if (weighted) {
        throw new Error(
          `question ${id} is a fit question but option ${weighted.id} has archetype weights`,
        )
      }
    }
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

function parseWarningSign(raw: unknown, index: number, questions: Question[]): WarningSign {
  if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id === '') {
    throw new Error(`warning sign at index ${index} is missing an "id"`)
  }
  const id = raw.id
  if (typeof raw.note !== 'string' || raw.note === '') {
    throw new Error(`warning sign ${id} is missing a "note" for the team brief`)
  }
  if (!Array.isArray(raw.when) || raw.when.length === 0) {
    throw new Error(`warning sign ${id} needs at least one condition in "when"`)
  }
  const when = raw.when.map((condition: unknown): WarningCondition => {
    if (!isRecord(condition)) throw new Error(`warning sign ${id} has a condition that is not an object`)
    const question = questions.find((q) => q.id === condition.question)
    if (!question) {
      throw new Error(`warning sign ${id} refers to unknown question: ${String(condition.question)}`)
    }
    if (!question.options.some((o) => o.id === condition.option)) {
      throw new Error(
        `warning sign ${id} refers to unknown answer ${String(condition.option)} on question ${question.id}`,
      )
    }
    return { question: question.id, option: condition.option as string }
  })
  return { id, note: raw.note, when }
}

function parseWarningSigns(raw: unknown, questions: Question[]): WarningSign[] {
  const rawSigns = raw === undefined ? [] : raw
  if (!Array.isArray(rawSigns)) throw new Error('lead rules "warningSigns" must be a list')
  const warningSigns = rawSigns.map((f: unknown, i: number) => parseWarningSign(f, i, questions))
  const seen = new Set<string>()
  for (const f of warningSigns) {
    if (seen.has(f.id)) throw new Error(`duplicate warning sign id: ${f.id}`)
    seen.add(f.id)
  }
  return warningSigns
}

function parseThresholds(raw: unknown, optionId: string): ProjectThresholds {
  if (!isRecord(raw)) throw new Error(`project type ${optionId} thresholds must be an object`)
  for (const field of ['hotFrom', 'warmFrom'] as const) {
    const value = raw[field]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error(`project type ${optionId} needs a number of 0 or more for "${field}"`)
    }
  }
  const hotFrom = raw.hotFrom as number
  const warmFrom = raw.warmFrom as number
  if (hotFrom < warmFrom) {
    throw new Error(
      `project type ${optionId} "hotFrom" (${hotFrom}) must not be below "warmFrom" (${warmFrom})`,
    )
  }
  return { hotFrom, warmFrom }
}

// Cross-checks the lead rules against the question bank so a renamed or added
// project type cannot be left without budget thresholds.
export function parseLeadRules(raw: unknown, questions: Question[]): LeadRules {
  if (!isRecord(raw)) throw new Error('lead rules must be an object')
  const byId = new Map(questions.map((q) => [q.id, q]))

  const project = byId.get(raw.projectQuestion as string)
  if (!project) {
    throw new Error(`lead rules "projectQuestion" names unknown question: ${String(raw.projectQuestion)}`)
  }
  if (project.kind !== 'single') {
    throw new Error(`lead rules "projectQuestion" ${project.id} must be a single choice question`)
  }
  const investment = byId.get(raw.investmentQuestion as string)
  if (!investment) {
    throw new Error(
      `lead rules "investmentQuestion" names unknown question: ${String(raw.investmentQuestion)}`,
    )
  }
  if (investment.kind !== 'range') {
    throw new Error(`lead rules "investmentQuestion" ${investment.id} must be a range question`)
  }

  if (!isRecord(raw.thresholds)) throw new Error('lead rules need a "thresholds" object')
  const projectTypes = new Set(project.options.map((o) => o.id))
  const thresholds: Record<string, ProjectThresholds> = {}
  for (const [optionId, entry] of Object.entries(raw.thresholds)) {
    if (!projectTypes.has(optionId)) {
      throw new Error(`lead rules have thresholds for unknown project type: ${optionId}`)
    }
    thresholds[optionId] = parseThresholds(entry, optionId)
  }
  for (const optionId of projectTypes) {
    if (!(optionId in thresholds)) {
      throw new Error(`lead rules have no thresholds for project type ${optionId}`)
    }
  }

  if (!LEAD_TEMPERATURES.includes(raw.unsureStart as LeadTemperature)) {
    throw new Error(`lead rules "unsureStart" must be hot, warm or cold, not ${String(raw.unsureStart)}`)
  }

  if (!Array.isArray(raw.details)) throw new Error('lead rules need a "details" list')
  const seen = new Set<string>()
  const details = raw.details.map((entry: unknown, index: number): LeadDetailRule => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      typeof entry.label !== 'string' ||
      typeof entry.questionId !== 'string'
    ) {
      throw new Error(`lead detail at index ${index} needs an "id", "label" and "questionId"`)
    }
    if (!byId.has(entry.questionId)) {
      throw new Error(`lead detail ${entry.id} names unknown question: ${entry.questionId}`)
    }
    if (seen.has(entry.id)) throw new Error(`duplicate lead detail id: ${entry.id}`)
    seen.add(entry.id)
    return { id: entry.id, label: entry.label, questionId: entry.questionId }
  })

  return {
    projectQuestion: project.id,
    investmentQuestion: investment.id,
    thresholds,
    unsureStart: raw.unsureStart as LeadTemperature,
    details,
    warningSigns: parseWarningSigns(raw.warningSigns, questions),
  }
}

export function loadLeadRules(): LeadRules {
  return parseLeadRules(leadRulesJson as unknown, loadQuestions())
}

export function parseSampleSubmissions(raw: unknown, questions: Question[]): SampleSubmission[] {
  if (!isRecord(raw) || !Array.isArray(raw.samples)) {
    throw new Error('sample submissions must have a "samples" array')
  }
  return raw.samples.map((entry: unknown, index: number): SampleSubmission => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      !isRecord(entry.contact) ||
      !isRecord(entry.answers)
    ) {
      throw new Error(`sample at index ${index} needs an "id", "contact" and "answers"`)
    }
    const sample = entry as unknown as SampleSubmission
    const problems = validateSubmission(sample, questions)
    if (problems.length > 0) {
      throw new Error(`sample ${sample.id} is invalid:\n- ${problems.join('\n- ')}`)
    }
    return sample
  })
}

const COPY_FIELDS = [
  'greeting',
  'intro',
  'projectTitle',
  'confidenceTitle',
  'confidenceQuestion',
  'homeTitle',
  'homeQuestion',
  'closing',
] as const
const CTA_FIELDS = ['label', 'text', 'bookingUrl', 'fallback'] as const

// When `questions` is given, also checks that every referenced question exists.
export function parseClientCopy(raw: unknown, questions?: Question[]): ClientCopy {
  if (!isRecord(raw)) throw new Error('client result copy must be an object')
  for (const field of COPY_FIELDS) {
    if (typeof raw[field] !== 'string' || raw[field] === '') {
      throw new Error(`client result copy is missing "${field}"`)
    }
  }
  if (!isRecord(raw.cta)) throw new Error('client result copy is missing "cta"')
  const cta = raw.cta
  for (const field of CTA_FIELDS) {
    if (typeof cta[field] !== 'string' || cta[field] === '') {
      throw new Error(`client result copy is missing "cta.${field}"`)
    }
  }
  if (!Array.isArray(raw.projectLines)) {
    throw new Error('client result copy is missing "projectLines"')
  }
  const copy = raw as unknown as ClientCopy
  if (questions) {
    const ids = new Set(questions.map((q) => q.id))
    const referenced = [
      ...copy.projectLines.map((l) => l.question),
      copy.confidenceQuestion,
      copy.homeQuestion,
    ]
    for (const id of referenced) {
      if (!ids.has(id)) throw new Error(`client result copy refers to unknown question: ${id}`)
    }
  }
  return copy
}

export function loadClientCopy(): ClientCopy {
  return parseClientCopy(clientResultJson as unknown, loadQuestions())
}

export function loadQuizData(): QuizData {
  const archetypes = loadArchetypes()
  const questions = parseQuestionBank(
    questionsJson as unknown,
    archetypes.map((a) => a.id),
  )
  return {
    archetypes,
    questions,
    signalRules: parseSignalRules(
      signalsJson as unknown,
      archetypes.map((a) => a.id),
    ),
    leadRules: parseLeadRules(leadRulesJson as unknown, questions),
  }
}

export function loadSampleSubmissions(): SampleSubmission[] {
  return parseSampleSubmissions(samplesJson as unknown, loadQuestions())
}
