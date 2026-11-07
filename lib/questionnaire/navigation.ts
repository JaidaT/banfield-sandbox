import { visibleSteps } from './visibility'
import type { Answers, Questionnaire } from './types'

// Position of each step in the file, so we can find the next visible step
// even from a step that has just become hidden.
function positions(questionnaire: Questionnaire, answers: Answers) {
  const order = questionnaire.steps.map((s) => s.id)
  const visible = visibleSteps(questionnaire, answers).map((v) => ({
    id: v.step.id,
    index: order.indexOf(v.step.id),
    hasQuestions: v.step.questions.length > 0,
  }))
  return { order, visible }
}

// The next step that shows for these answers, or null after the last one.
export function nextStepId(questionnaire: Questionnaire, answers: Answers, currentId: string): string | null {
  const { order, visible } = positions(questionnaire, answers)
  const current = order.indexOf(currentId)
  return visible.find((s) => s.index > current)?.id ?? null
}

// The previous step that shows for these answers, or null before the first.
export function previousStepId(questionnaire: Questionnaire, answers: Answers, currentId: string): string | null {
  const { order, visible } = positions(questionnaire, answers)
  const current = order.indexOf(currentId)
  return visible.filter((s) => s.index < current).at(-1)?.id ?? null
}

// "Step 4 of 11". Steps with no questions (the welcome) are not counted, and
// get null. The total changes as answers open or skip steps.
export function progress(
  questionnaire: Questionnaire,
  answers: Answers,
  currentId: string,
): { number: number; total: number } | null {
  const counted = positions(questionnaire, answers).visible.filter((s) => s.hasQuestions)
  const number = counted.findIndex((s) => s.id === currentId) + 1
  if (number === 0) return null
  return { number, total: counted.length }
}
