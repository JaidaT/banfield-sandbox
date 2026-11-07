import { isBlank } from './validate'
import { visibleAnswers, visibleSteps } from './visibility'
import type { AnswerValue, Answers, ImagePicks, Question, Questionnaire, RepeaterEntry } from './types'

// answered: has an answer. skipped: shown but left blank. hidden: a rule hid it.
export type AnswerStatus = 'answered' | 'skipped' | 'hidden'

// One line on a repeater card, e.g. { label: "Age", value: "38" }.
export interface CardLine {
  label: string
  value: string
}

export interface OutputAnswer {
  id: string
  prompt: string
  status: AnswerStatus
  // Readable answer: choice labels, numbers as text, picture picks in words.
  value?: string
  // Repeater answers: one list of lines per card. Empty cards are dropped.
  cards?: CardLine[][]
}

export interface OutputStep {
  id: string
  title: string
  answers: OutputAnswer[]
}

// What the team sees after submit. Hidden answers are never included.
export interface QuestionnaireOutput {
  steps: OutputStep[]
  // Titles of steps a rule skipped, e.g. ["Kids", "Pets"].
  skippedSteps: string[]
}

function readablePicks(question: Question, picks: ImagePicks): string {
  return (question.imageSets ?? [])
    .flatMap((set, i) => {
      const pick = picks[set.id]
      if (!pick) return []
      const name = (id: string) => set.images.find((img) => img.id === id)?.label ?? id
      const parts = []
      if (pick.favourite) parts.push(`favourite ${name(pick.favourite)}`)
      if (pick.least) parts.push(`least favourite ${name(pick.least)}`)
      return parts.length > 0 ? [`Picture set ${i + 1}: ${parts.join(', ')}`] : []
    })
    .join('. ')
}

// Turns a stored answer into the words the person saw.
function readable(question: Question, value: AnswerValue): string {
  const label = (id: string) => question.options.find((o) => o.id === id)?.label ?? id
  switch (question.kind) {
    case 'single':
      return label(value as string)
    case 'multi':
      return (value as string[]).map(label).join(', ')
    case 'number':
      return String(value)
    case 'pick_images':
      return readablePicks(question, value as ImagePicks)
    default:
      return String(value).trim()
  }
}

// Each card as lines, leaving out blank fields and cards with nothing filled in.
function readableCards(question: Question, value: AnswerValue): CardLine[][] {
  const fields = question.fields ?? []
  return (value as RepeaterEntry[])
    .map((card) =>
      fields
        .filter((f) => !isBlank(card[f.id]))
        .map((f) => ({ label: f.prompt, value: readable(f, card[f.id]) })),
    )
    .filter((lines) => lines.length > 0)
}

function outputAnswer(question: Question, value: AnswerValue | undefined): OutputAnswer {
  const base = { id: question.id, prompt: question.prompt }
  if (question.kind === 'repeater') {
    const cards = value === undefined ? [] : readableCards(question, value)
    return cards.length > 0 ? { ...base, status: 'answered', cards } : { ...base, status: 'skipped' }
  }
  if (isBlank(value)) return { ...base, status: 'skipped' }
  const text = readable(question, value as AnswerValue)
  return text === '' ? { ...base, status: 'skipped' } : { ...base, status: 'answered', value: text }
}

// Builds the team summary. No time is tracked (team decision 2026-11-06).
export function buildOutput(questionnaire: Questionnaire, answers: Answers): QuestionnaireOutput {
  const shown = visibleSteps(questionnaire, answers)
  const kept = visibleAnswers(questionnaire, answers)
  const shownStepIds = new Set(shown.map((s) => s.step.id))

  const steps = shown
    .filter(({ step }) => step.questions.length > 0)
    .map(({ step, questions }): OutputStep => {
      const shownIds = new Set(questions.map((q) => q.id))
      return {
        id: step.id,
        title: step.title,
        answers: step.questions.map((q) =>
          shownIds.has(q.id) ? outputAnswer(q, kept[q.id]) : { id: q.id, prompt: q.prompt, status: 'hidden' },
        ),
      }
    })

  return {
    steps,
    skippedSteps: questionnaire.steps.filter((s) => !shownStepIds.has(s.id)).map((s) => s.title),
  }
}
