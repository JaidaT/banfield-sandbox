import questionnaireJson from '@/data/questionnaire/questionnaire.json'
import sampleAnswersJson from '@/data/questionnaire/sample-answers.json'
import { DERIVED_VALUES, QUESTION_KINDS, RANGE_FORMATS } from './types'
import type {
  Answers,
  AnswerValue,
  AnswerOption,
  SampleHousehold,
  Condition,
  DerivedName,
  FieldCondition,
  ImageSet,
  Question,
  QuestionKind,
  Questionnaire,
  RangeFormat,
  Step,
} from './types'

const OPERATORS = ['equals', 'in', 'includes', 'excludes', 'lessThan', 'atLeast'] as const

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
    throw new Error(`${owner} rule must name a "field" and use exactly one of equals, in, includes, excludes, lessThan or atLeast`)
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
    if (op !== 'equals' && op !== 'lessThan' && op !== 'atLeast') throw wrongFit()
    const value = raw[op]
    if (typeof value !== 'number') throw new Error(`${owner} rule "${op}" on ${field} must be a number`)
    if (op === 'equals') return { field, equals: value }
    if (op === 'lessThan') return { field, lessThan: value }
    return { field, atLeast: value }
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
    if (op === 'includes') {
      checkOption(raw.includes)
      return { field, includes: raw.includes as string }
    }
    if (op === 'excludes') {
      checkOption(raw.excludes)
      return { field, excludes: raw.excludes as string }
    }
    throw wrongFit()
  }
  throw new Error(`${owner} rule cannot depend on ${field} (a ${kind} question)`)
}

// A plain rule, or "any" (matches when at least one of its rules matches).
// "any" cannot contain another "any", so rules stay readable for the team.
function parseCondition(raw: unknown, owner: string, ctx: RuleContext, nested = false): Condition {
  if (!isRecord(raw)) throw new Error(`${owner} has a rule that is not an object`)
  if ('all' in raw) throw new Error(`${owner} uses "all", which is not supported (see DECISIONS.md)`)
  if (!('any' in raw)) return parseFieldCondition(raw, owner, ctx)
  if (nested) throw new Error(`${owner} has a nested "any" rule; only one level is allowed`)
  if (!Array.isArray(raw.any) || raw.any.length === 0) {
    throw new Error(`${owner} rule "any" must be a list of conditions`)
  }
  return { any: raw.any.map((c: unknown) => parseCondition(c, owner, ctx, true) as FieldCondition) }
}

function parseOptions(raw: unknown, name: string): AnswerOption[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error(`${name} needs at least one option`)
  const seen = new Set<string>()
  return raw.map((entry: unknown): AnswerOption => {
    if (!isRecord(entry) || !nonEmptyString(entry.id) || !nonEmptyString(entry.label)) {
      throw new Error(`${name} has an option without an "id" and "label"`)
    }
    if (seen.has(entry.id)) throw new Error(`${name} has duplicate option id: ${entry.id}`)
    seen.add(entry.id)
    const option: AnswerOption = { id: entry.id, label: entry.label }
    if (entry.image !== undefined) {
      if (!nonEmptyString(entry.image)) throw new Error(`${name} option ${entry.id} "image" must be a picture path`)
      option.image = entry.image
    }
    if (entry.showIf !== undefined) {
      throw new Error(
        `${name} option ${entry.id}: rules on answer choices are not supported; put the rule on the question instead`,
      )
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

// Checks a slider's numbers and format, and copies them onto the question.
function parseRange(raw: Record<string, unknown>, name: string, question: Question) {
  for (const key of ['min', 'max', 'step'] as const) {
    if (typeof raw[key] !== 'number' || !Number.isFinite(raw[key])) {
      throw new Error(`${name} "${key}" must be a number`)
    }
  }
  const min = raw.min as number
  const max = raw.max as number
  const step = raw.step as number
  if (min >= max) throw new Error(`${name} "min" must be below "max"`)
  if (step <= 0) throw new Error(`${name} "step" must be more than 0`)
  question.min = min
  question.max = max
  question.step = step
  if (raw.format !== undefined) {
    if (!RANGE_FORMATS.includes(raw.format as RangeFormat)) {
      throw new Error(`${name} has unknown format: ${String(raw.format)}`)
    }
    question.format = raw.format as RangeFormat
  }
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
    question.options = parseOptions(raw.options, name)
  } else if (kind === 'range') {
    // A slider's choices (such as "Not sure yet") are optional.
    if (raw.options !== undefined) question.options = parseOptions(raw.options, name)
  } else if (raw.options !== undefined) {
    throw new Error(`${name} has "options", but only single, multi and range questions use them`)
  }

  if (raw.maxSelections !== undefined) {
    if (kind !== 'multi') throw new Error(`${name} has "maxSelections", but only multi questions use it`)
    const limit = raw.maxSelections
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1) {
      throw new Error(`${name} "maxSelections" must be a whole number of 1 or more`)
    }
    question.maxSelections = limit
  }

  if (kind === 'range') parseRange(raw, name, question)

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

// The real questionnaire from data/questionnaire/questionnaire.json.
export function loadQuestionnaire(): Questionnaire {
  return parseQuestionnaire(questionnaireJson as unknown)
}

// Checks one answer against its question. `where` names the sample and question.
// Repeater cards and picture picks are checked inside; returns the answer as typed.
function checkAnswer(question: Question, value: unknown, where: string): AnswerValue {
  const optionIds = new Set(question.options.map((o) => o.id))
  switch (question.kind) {
    case 'short_text':
    case 'long_text':
      if (typeof value !== 'string') throw new Error(`${where} must be text`)
      return value
    case 'number':
      if (typeof value !== 'number') throw new Error(`${where} must be a number`)
      return value
    case 'range': {
      if (typeof value === 'string') {
        if (!optionIds.has(value)) throw new Error(`${where} has unknown answer ${value}`)
        return value
      }
      const min = question.min ?? 0
      const max = question.max ?? 0
      const step = question.step ?? 1
      if (typeof value !== 'number' || value < min || value > max) {
        throw new Error(`${where} must be a number from ${min} to ${max}, or one of its choices`)
      }
      if ((value - min) % step !== 0) throw new Error(`${where} must be in steps of ${step} from ${min}`)
      return value
    }
    case 'single':
      if (typeof value !== 'string' || !optionIds.has(value)) {
        throw new Error(`${where} has unknown answer ${String(value)}`)
      }
      return value
    case 'multi':
      if (!Array.isArray(value)) throw new Error(`${where} must be a list of answers`)
      for (const v of value) {
        if (typeof v !== 'string' || !optionIds.has(v)) throw new Error(`${where} has unknown answer ${String(v)}`)
      }
      if (question.maxSelections !== undefined && value.length > question.maxSelections) {
        throw new Error(`${where} picks more than ${question.maxSelections}`)
      }
      return value as string[]
    case 'repeater': {
      if (!Array.isArray(value)) throw new Error(`${where} must be a list of cards`)
      const fields = new Map((question.fields ?? []).map((f) => [f.id, f]))
      return value.map((card: unknown, i: number) => {
        if (!isRecord(card)) throw new Error(`${where} card ${i + 1} is not an object`)
        for (const [key, v] of Object.entries(card)) {
          const field = fields.get(key)
          if (!field) throw new Error(`${where} card ${i + 1} has unknown field ${key}`)
          checkAnswer(field, v, `${where} card ${i + 1} ${key}`)
        }
        return card as Record<string, string | number | string[]>
      })
    }
    case 'pick_images': {
      if (!isRecord(value)) throw new Error(`${where} must be an object keyed by image set`)
      const sets = new Map((question.imageSets ?? []).map((s) => [s.id, new Set(s.images.map((img) => img.id))]))
      for (const [setId, pick] of Object.entries(value)) {
        const imageIds = sets.get(setId)
        if (!imageIds) throw new Error(`${where} has unknown image set ${setId}`)
        if (!isRecord(pick)) throw new Error(`${where} ${setId} must have "favourite" and/or "least"`)
        for (const key of ['favourite', 'least'] as const) {
          const id = pick[key]
          if (id !== undefined && (typeof id !== 'string' || !imageIds.has(id))) {
            throw new Error(`${where} ${setId} has unknown image ${String(id)}`)
          }
        }
        if (pick.favourite !== undefined && pick.favourite === pick.least) {
          throw new Error(`${where} ${setId} has the same image as favourite and least favourite`)
        }
      }
      return value as Record<string, { favourite?: string; least?: string }>
    }
  }
}

// Validates the sample households so a typo in an answer fails with a message
// naming the sample and question.
export function parseSampleHouseholds(raw: unknown, questionnaire: Questionnaire): SampleHousehold[] {
  if (!isRecord(raw) || !Array.isArray(raw.samples)) throw new Error('sample answers must have a "samples" list')
  const questions = new Map(questionnaire.steps.flatMap((s) => s.questions).map((q) => [q.id, q]))
  const stepIds = new Set(questionnaire.steps.map((s) => s.id))
  const seen = new Set<string>()

  return raw.samples.map((entry: unknown, index: number): SampleHousehold => {
    if (!isRecord(entry) || !nonEmptyString(entry.id)) throw new Error(`sample at index ${index} is missing an "id"`)
    const id = entry.id
    if (seen.has(id)) throw new Error(`duplicate sample id: ${id}`)
    seen.add(id)
    if (!nonEmptyString(entry.label) || typeof entry.note !== 'string') {
      throw new Error(`sample ${id} needs a "label" and a "note"`)
    }
    if (!Array.isArray(entry.expectedSteps)) throw new Error(`sample ${id} needs an "expectedSteps" list`)
    for (const step of entry.expectedSteps) {
      if (typeof step !== 'string' || !stepIds.has(step)) throw new Error(`sample ${id} expects unknown step ${String(step)}`)
    }
    if (!isRecord(entry.answers)) throw new Error(`sample ${id} needs an "answers" object`)

    const answers: Answers = {}
    for (const [questionId, value] of Object.entries(entry.answers)) {
      const question = questions.get(questionId)
      if (!question) throw new Error(`sample ${id} answers unknown question ${questionId}`)
      answers[questionId] = checkAnswer(question, value, `sample ${id} question ${questionId}`)
    }
    return { id, label: entry.label, note: entry.note, expectedSteps: entry.expectedSteps as string[], answers }
  })
}

// The made-up households from data/questionnaire/sample-answers.json.
export function loadSampleHouseholds(): SampleHousehold[] {
  return parseSampleHouseholds(sampleAnswersJson as unknown, loadQuestionnaire())
}
