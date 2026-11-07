import { DERIVED_VALUES, QUESTION_KINDS } from './types'
import type {
  AnswerOption,
  Condition,
  DerivedName,
  FieldCondition,
  ImageSet,
  Question,
  QuestionKind,
  Questionnaire,
  Step,
} from './types'

// A step with more inputs than this is flagged for review. QUESTIONNAIRE_DISCOVERY
// P3 suggested 6; the team raised it to 7 on 2026-11-06 (see DECISIONS.md).
const MAX_INPUTS_PER_STEP = 7

const OPERATORS = ['equals', 'in', 'includes', 'lessThan'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== ''
}

// Questions a rule may point at: only ones that come earlier in the file.
interface RuleContext {
  earlier: Map<string, Question>
  allIds: Set<string>
}

function parseFieldCondition(raw: Record<string, unknown>, owner: string, ctx: RuleContext): FieldCondition {
  const used = OPERATORS.filter((op) => op in raw)
  if (!nonEmptyString(raw.field) || used.length !== 1) {
    throw new Error(`${owner} rule must name a "field" and use exactly one of equals, in, includes or lessThan`)
  }
  const field = raw.field
  const op = used[0]

  const isDerived = DERIVED_VALUES.includes(field as DerivedName)
  const target = ctx.earlier.get(field)
  if (!isDerived && !target) {
    if (ctx.allIds.has(field)) {
      throw new Error(`${owner} rule refers to ${field}, which comes later in the questionnaire`)
    }
    throw new Error(`${owner} rule refers to unknown question or value: ${field}`)
  }

  const kind: QuestionKind | 'derived' = isDerived ? 'derived' : (target as Question).kind
  const optionIds = new Set(target?.options.map((o) => o.id))
  const checkOption = (value: unknown) => {
    if (typeof value !== 'string' || !optionIds.has(value)) {
      throw new Error(`${owner} rule refers to unknown answer ${String(value)} on ${field}`)
    }
  }
  const wrongFit = () =>
    new Error(`${owner} rule cannot use ${op} on ${field} (a ${kind} question)`)

  if (kind === 'derived' || kind === 'number') {
    if (op !== 'equals' && op !== 'lessThan') throw wrongFit()
    if (typeof raw[op] !== 'number') throw new Error(`${owner} rule "${op}" on ${field} must be a number`)
    return op === 'equals' ? { field, equals: raw.equals as number } : { field, lessThan: raw.lessThan as number }
  }
  if (kind === 'single') {
    if (op === 'equals') {
      checkOption(raw.equals)
      return { field, equals: raw.equals as string }
    }
    if (op === 'in') {
      if (!Array.isArray(raw.in) || raw.in.length === 0) {
        throw new Error(`${owner} rule "in" on ${field} must be a list of answers`)
      }
      raw.in.forEach(checkOption)
      return { field, in: raw.in as string[] }
    }
    throw wrongFit()
  }
  if (kind === 'multi') {
    if (op !== 'includes') throw wrongFit()
    checkOption(raw.includes)
    return { field, includes: raw.includes as string }
  }
  throw new Error(`${owner} rule cannot depend on ${field} (a ${kind} question)`)
}

// One level of any/all at most, so rules stay readable for the team.
function parseCondition(raw: unknown, owner: string, ctx: RuleContext, nested = false): Condition {
  if (!isRecord(raw)) throw new Error(`${owner} has a rule that is not an object`)
  for (const group of ['any', 'all'] as const) {
    if (!(group in raw)) continue
    if (nested) throw new Error(`${owner} has a nested "any"/"all" rule; only one level is allowed`)
    const list = raw[group]
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error(`${owner} rule "${group}" must be a list of conditions`)
    }
    const conditions = list.map((c: unknown) => parseCondition(c, owner, ctx, true) as FieldCondition)
    return group === 'any' ? { any: conditions } : { all: conditions }
  }
  return parseFieldCondition(raw, owner, ctx)
}

function parseOptions(raw: unknown, name: string, ctx: RuleContext, rulesAllowed: boolean): AnswerOption[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error(`${name} needs at least one option`)
  const seen = new Set<string>()
  return raw.map((entry: unknown): AnswerOption => {
    if (!isRecord(entry) || !nonEmptyString(entry.id) || !nonEmptyString(entry.label)) {
      throw new Error(`${name} has an option without an "id" and "label"`)
    }
    if (seen.has(entry.id)) throw new Error(`${name} has duplicate option id: ${entry.id}`)
    seen.add(entry.id)
    const option: AnswerOption = { id: entry.id, label: entry.label }
    if (entry.showIf !== undefined) {
      if (!rulesAllowed) throw new Error(`${name}: rules inside a repeater card are not supported yet`)
      option.showIf = parseCondition(entry.showIf, `${name} option ${entry.id}`, ctx)
    }
    return option
  })
}

function parseImageSets(raw: unknown, name: string): ImageSet[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error(`${name} needs at least one image set`)
  return raw.map((set: unknown): ImageSet => {
    if (!isRecord(set) || !nonEmptyString(set.id) || !Array.isArray(set.images)) {
      throw new Error(`${name} has an image set without an "id" and "images"`)
    }
    if (set.images.length < 2) throw new Error(`${name} image set ${set.id} needs at least 2 images`)
    const seen = new Set<string>()
    const images = set.images.map((img: unknown) => {
      if (!isRecord(img) || !nonEmptyString(img.id)) {
        throw new Error(`${name} image set ${set.id} has an image without an "id"`)
      }
      if (!nonEmptyString(img.label)) throw new Error(`${name} image ${img.id} is missing a "label"`)
      if (!nonEmptyString(img.src)) throw new Error(`${name} image ${img.id} is missing a "src"`)
      if (seen.has(img.id)) throw new Error(`${name} image set ${set.id} has duplicate image id: ${img.id}`)
      seen.add(img.id)
      return { id: img.id, label: img.label, src: img.src }
    })
    return { id: set.id, images }
  })
}

// `parent` is the repeater's id when parsing the questions on its cards.
function parseQuestion(raw: unknown, where: string, ctx: RuleContext, parent?: string): Question {
  if (!isRecord(raw) || !nonEmptyString(raw.id)) throw new Error(`${where} is missing an "id"`)
  const id = raw.id
  const name = parent ? `question ${parent} field ${id}` : `question ${id}`

  if (!QUESTION_KINDS.includes(raw.kind as QuestionKind)) {
    throw new Error(`${name} has unknown kind: ${String(raw.kind)}`)
  }
  const kind = raw.kind as QuestionKind
  if (!nonEmptyString(raw.prompt)) throw new Error(`${name} is missing a "prompt"`)
  if (raw.required !== undefined && typeof raw.required !== 'boolean') {
    throw new Error(`${name} "required" must be true or false`)
  }

  const question: Question = { id, kind, prompt: raw.prompt, required: raw.required === true, options: [] }
  if (typeof raw.help === 'string') question.help = raw.help
  if (raw.showIf !== undefined) {
    if (parent) throw new Error(`${name}: rules inside a repeater card are not supported yet`)
    question.showIf = parseCondition(raw.showIf, name, ctx)
  }

  if (kind === 'single' || kind === 'multi') {
    question.options = parseOptions(raw.options, name, ctx, !parent)
  } else if (raw.options !== undefined) {
    throw new Error(`${name} has "options", but only single and multi questions use them`)
  }

  if (kind === 'repeater') {
    if (parent) throw new Error(`question ${parent} has a repeater inside a repeater (${id})`)
    if (!Array.isArray(raw.fields) || raw.fields.length === 0) {
      throw new Error(`${name} needs at least one question in "fields"`)
    }
    const seen = new Set<string>()
    question.fields = raw.fields.map((f: unknown, i: number) => {
      const field = parseQuestion(f, `${name} field at index ${i}`, ctx, id)
      if (seen.has(field.id)) throw new Error(`${name} has duplicate field id: ${field.id}`)
      seen.add(field.id)
      return field
    })
    if (typeof raw.addLabel === 'string') question.addLabel = raw.addLabel
    if (raw.max !== undefined) {
      if (typeof raw.max !== 'number' || !Number.isInteger(raw.max) || raw.max < 1) {
        throw new Error(`${name} "max" must be a whole number of 1 or more`)
      }
      question.max = raw.max
    }
  }

  if (kind === 'pick_images') question.imageSets = parseImageSets(raw.imageSets, name)
  return question
}

// Validates the questionnaire file so a typo in an id or a rule fails loudly
// with a message naming the step or question, instead of quietly hiding steps.
export function parseQuestionnaire(raw: unknown): Questionnaire {
  if (!isRecord(raw) || !Array.isArray(raw.steps)) {
    throw new Error('questionnaire must have a "steps" list')
  }
  const allIds = new Set<string>()
  for (const step of raw.steps) {
    if (isRecord(step) && Array.isArray(step.questions)) {
      for (const q of step.questions) if (isRecord(q) && nonEmptyString(q.id)) allIds.add(q.id)
    }
  }
  const ctx: RuleContext = { earlier: new Map(), allIds }
  const stepIds = new Set<string>()

  const steps = raw.steps.map((entry: unknown, index: number): Step => {
    if (!isRecord(entry) || !nonEmptyString(entry.id)) throw new Error(`step at index ${index} is missing an "id"`)
    const id = entry.id
    if (stepIds.has(id)) throw new Error(`duplicate step id: ${id}`)
    stepIds.add(id)
    if (!nonEmptyString(entry.title)) throw new Error(`step ${id} is missing a "title"`)
    if (!Array.isArray(entry.questions)) throw new Error(`step ${id} needs a "questions" list`)

    const step: Step = { id, title: entry.title, questions: [] }
    if (typeof entry.intro === 'string') step.intro = entry.intro
    // Parsed before the step's own questions, so a step rule can only use earlier steps.
    if (entry.showIf !== undefined) step.showIf = parseCondition(entry.showIf, `step ${id}`, ctx)

    step.questions = entry.questions.map((q: unknown, i: number) => {
      const question = parseQuestion(q, `step ${id} question at index ${i}`, ctx)
      if (ctx.earlier.has(question.id)) throw new Error(`duplicate question id: ${question.id}`)
      ctx.earlier.set(question.id, question)
      return question
    })
    return step
  })
  return { steps }
}

// Steps that would show more than 7 inputs if every question on them showed.
// A warning list for review, not an error: inline branches may keep the real
// number lower.
export function stepSizeWarnings(questionnaire: Questionnaire): string[] {
  return questionnaire.steps
    .filter((s) => s.questions.length > MAX_INPUTS_PER_STEP)
    .map((s) => `Step ${s.id} has ${s.questions.length} inputs when every question shows`)
}
