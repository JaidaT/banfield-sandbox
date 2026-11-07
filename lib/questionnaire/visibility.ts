import { deriveValues } from './derived'
import { DERIVED_VALUES } from './types'
import type {
  AnswerOption,
  Answers,
  AnswerValue,
  Condition,
  DerivedName,
  DerivedValues,
  FieldCondition,
  Question,
  Questionnaire,
  Step,
} from './types'

// A question as it shows right now, with only the answer choices on offer.
export interface VisibleQuestion {
  question: Question
  options: AnswerOption[]
}

export interface VisibleStep {
  step: Step
  questions: VisibleQuestion[]
}

function lookup(field: string, answers: Answers, derived: DerivedValues): AnswerValue | null | undefined {
  if (DERIVED_VALUES.includes(field as DerivedName)) return derived[field as DerivedName]
  return answers[field]
}

function matchesOne(condition: FieldCondition, answers: Answers, derived: DerivedValues): boolean {
  const value = lookup(condition.field, answers, derived)
  if ('equals' in condition) return value === condition.equals
  if ('in' in condition) return typeof value === 'string' && condition.in.includes(value)
  if ('includes' in condition) return Array.isArray(value) && (value as unknown[]).includes(condition.includes)
  // lessThan and atLeast: a missing number never matches.
  if (typeof value !== 'number') return false
  if ('lessThan' in condition) return value < condition.lessThan
  return value >= condition.atLeast
}

// True when the rule matches these answers. A missing answer never matches.
export function matches(condition: Condition, answers: Answers, derived: DerivedValues): boolean {
  if ('any' in condition) return condition.any.some((c) => matchesOne(c, answers, derived))
  if ('all' in condition) return condition.all.every((c) => matchesOne(c, answers, derived))
  return matchesOne(condition, answers, derived)
}

// Keeps an answer only if it is still one of the choices on offer.
function keepOffered(question: Question, options: AnswerOption[], value: AnswerValue | undefined) {
  if (value === undefined) return undefined
  if (question.kind !== 'single' && question.kind !== 'multi') return value
  const offered = new Set(options.map((o) => o.id))
  if (question.kind === 'single') return typeof value === 'string' && offered.has(value) ? value : undefined
  if (!Array.isArray(value)) return undefined
  const ticked = (value as string[]).filter((id) => offered.has(id))
  return ticked.length > 0 ? ticked : undefined
}

// Walks the questionnaire in order. Rules only point at earlier questions, so
// each rule is checked against the answers kept so far. That way a leftover
// answer to a hidden question (say, a contractor "Yes" before switching to
// furniture) can never open that question's follow-ups.
function walk(questionnaire: Questionnaire, answers: Answers) {
  const kept: Answers = {}
  const shows = (rule?: Condition) => rule === undefined || matches(rule, kept, deriveValues(kept))
  const steps: VisibleStep[] = []

  for (const step of questionnaire.steps) {
    if (!shows(step.showIf)) continue
    const questions: VisibleQuestion[] = []
    for (const question of step.questions) {
      if (!shows(question.showIf)) continue
      const options = question.options.filter((o) => shows(o.showIf))
      questions.push({ question, options })
      const value = keepOffered(question, options, answers[question.id])
      if (value !== undefined) kept[question.id] = value
    }
    steps.push({ step, questions })
  }
  return { steps, answers: kept }
}

// The steps that show for these answers, each with its visible questions.
export function visibleSteps(questionnaire: Questionnaire, answers: Answers): VisibleStep[] {
  return walk(questionnaire, answers).steps
}

// The answers to visible questions only. The screen keeps every answer (in case
// the person switches back), but the summary and checks use this.
export function visibleAnswers(questionnaire: Questionnaire, answers: Answers): Answers {
  return walk(questionnaire, answers).answers
}
