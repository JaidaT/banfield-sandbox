import { visibleAnswers, visibleSteps } from './visibility'
import type { VisibleStep } from './visibility'
import type { Answers, AnswerValue, ImagePicks, Questionnaire } from './types'

// One thing to fix before moving on, shown next to the question.
export interface Problem {
  stepId: string
  questionId: string
  message: string
}

// True for a missing answer, spaces only, an empty list or an empty object.
export function isBlank(value: AnswerValue | undefined): boolean {
  if (value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'number') return false
  if (Array.isArray(value)) return value.length === 0
  return Object.keys(value).length === 0
}

// Only visible questions are checked, against answers to visible questions,
// so a hidden question is never required.
function problemsOnStep({ step, questions }: VisibleStep, answers: Answers): Problem[] {
  const problems: Problem[] = []
  const add = (questionId: string, message: string) => problems.push({ stepId: step.id, questionId, message })

  for (const question of questions) {
    const value = answers[question.id]
    if (question.required && isBlank(value)) add(question.id, `Please answer "${question.prompt}"`)

    if (question.kind === 'repeater' && question.max !== undefined && Array.isArray(value)) {
      // Empty "add another" cards are ignored; they are dropped from the summary.
      const cards = (value as Record<string, string | number | string[]>[]).filter(
        (card) => !Object.values(card).every(isBlank),
      )
      if (cards.length > question.max) add(question.id, `Please add no more than ${question.max}`)
    }

    if (question.kind === 'multi' && question.maxSelections !== undefined && Array.isArray(value)) {
      if (value.length > question.maxSelections) add(question.id, `Please pick no more than ${question.maxSelections}`)
    }

    if (question.kind === 'pick_images' && value !== undefined) {
      const picks = value as ImagePicks
      ;(question.imageSets ?? []).forEach((set, i) => {
        const pick = picks[set.id]
        if (pick?.favourite !== undefined && pick.favourite === pick.least) {
          add(question.id, `Pick a different least favourite in picture set ${i + 1}`)
        }
      })
    }
  }
  return problems
}

// Problems on one step, for blocking Next.
export function stepProblems(questionnaire: Questionnaire, answers: Answers, stepId: string): Problem[] {
  const step = visibleSteps(questionnaire, answers).find((s) => s.step.id === stepId)
  return step ? problemsOnStep(step, visibleAnswers(questionnaire, answers)) : []
}

// Problems on every visible step, for checking before submit.
export function allProblems(questionnaire: Questionnaire, answers: Answers): Problem[] {
  const kept = visibleAnswers(questionnaire, answers)
  return visibleSteps(questionnaire, answers).flatMap((step) => problemsOnStep(step, kept))
}
