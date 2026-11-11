import questionnaireJson from '@/data/long-questionnaire/questionnaire.json'
import sampleAnswersJson from '@/data/long-questionnaire/sample-answers.json'
import { checkAnswer, isRecord, nonEmptyString, parseQuestionnaire } from '@/lib/form/parse'
import type { SampleHousehold } from './sampleTypes'
import type { Answers, Questionnaire } from '@/lib/form/types'

// The real questionnaire from data/questionnaire/questionnaire.json.
export function loadQuestionnaire(): Questionnaire {
  return parseQuestionnaire(questionnaireJson as unknown)
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
