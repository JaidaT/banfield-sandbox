import { answerLabels } from './answers'
import { assessFit } from './assessFit'
import { scoreArchetypes } from './scoreArchetypes'
import { evaluateSignals, skippedQuestions } from './signals'
import type {
  AnswerLine,
  ArchetypeGuidance,
  Question,
  QuizData,
  Submission,
  TeamBrief,
} from './types'

// Draft cutoffs: show guidance for types at 20% or more, at most two (Oct 28 meeting).
const HIGHLIGHT_MIN_PERCENT = 20
const HIGHLIGHT_MAX = 2

export function shortLabel(label: string): string {
  return label.replace(/^The /, '')
}

function readableAnswer(question: Question, submission: Submission): string | null {
  const labels = answerLabels(question, submission.answers[question.id])
  return labels.length > 0 ? labels.join('; ') : null
}

export function buildTeamBrief(submission: Submission, data: QuizData): TeamBrief {
  const blend = scoreArchetypes(submission, data.questions, data.archetypes, data.signalRules)
  const fit = assessFit(submission, data.questions, data.fitRules)
  const signals = evaluateSignals(submission, data.questions, data.signalRules)

  const top = blend.insufficient
    ? []
    : blend.scores.filter((s, i) => i === 0 || s.percent >= HIGHLIGHT_MIN_PERCENT).slice(0, HIGHLIGHT_MAX)
  const highlights: ArchetypeGuidance[] = top.flatMap((score) => {
    const a = data.archetypes.find((x) => x.id === score.id)
    if (!a) return []
    return [
      {
        id: a.id,
        label: a.label,
        tagline: a.tagline,
        percent: score.percent,
        communication: a.communication,
        pacing: a.pacing,
        pitch: a.pitch,
        risks: a.risks,
        tip: a.brief_tips,
      },
    ]
  })

  const leadLabel = `${fit.temperature[0].toUpperCase()}${fit.temperature.slice(1)} lead`
  const typeLine =
    highlights.length === 0
      ? 'Not enough answers to identify a client type'
      : highlights.map((h) => `${h.percent}% ${shortLabel(h.label)}`).join(' / ')

  const answers: AnswerLine[] = data.questions.map((q) => ({
    questionId: q.id,
    prompt: q.prompt,
    answer: readableAnswer(q, submission),
  }))

  return {
    submissionId: submission.id,
    headline: `${leadLabel} | ${typeLine}`,
    contact: submission.contact,
    blend,
    highlights,
    fit,
    behaviour: {
      durationSeconds: signals.values.durationSeconds,
      skippedQuestions: skippedQuestions(submission, data.questions).map((q) => q.prompt),
      avgTextLength: signals.values.avgTextLength,
      notes: signals.matched.map((r) => r.note),
    },
    answers,
  }
}
