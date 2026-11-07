import { deriveValues } from './derived'
import { DERIVED_VALUES } from './types'
import type {
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

// A step that shows for the current answers, with only its visible questions.
export interface VisibleStep {
  step: Step
  questions: Question[]
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
    const questions: Question[] = []
    for (const question of step.questions) {
      if (!shows(question.showIf)) continue
      questions.push(question)
      if (answers[question.id] !== undefined) kept[question.id] = answers[question.id]
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
