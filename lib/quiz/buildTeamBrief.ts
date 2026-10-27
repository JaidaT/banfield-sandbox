import { assessFit } from './assessFit'
import { scoreArchetypes } from './scoreArchetypes'
import { evaluateSignals } from './signals'
import type {
  AnswerLine,
  ArchetypeGuidance,
  Question,
  QuizData,
  Submission,
  TeamBrief,
} from './types'

// Draft cutoffs: show guidance for types at 20% or more, at most three.
const HIGHLIGHT_MIN_PERCENT = 20
const HIGHLIGHT_MAX = 3

export function shortLabel(label: string): string {
  return label.replace(/^The /, '')
}

function readableAnswer(question: Question, submission: Submission): string | null {
  const answer = submission.answers[question.id]
  if (answer === undefined) return null
  if (question.kind === 'text') {
    return typeof answer === 'string' && answer.trim() !== '' ? answer.trim() : null
  }
  const chosen = Array.isArray(answer) ? answer : [answer]
  const labels = question.options.filter((o) => chosen.includes(o.id)).map((o) => o.label)
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

  const fitLabel = `${fit.overall[0].toUpperCase()}${fit.overall.slice(1)} fit`
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
    headline: `${typeLine} | ${fitLabel}`,
    contact: submission.contact,
    blend,
    highlights,
    fit,
    behaviour: {
      durationSeconds: signals.values.durationSeconds,
      skippedQuestions: data.questions
        .filter((q) => !(q.id in submission.answers))
        .map((q) => q.prompt),
      avgTextLength: signals.values.avgTextLength,
      notes: signals.matched.map((r) => r.note),
    },
    answers,
  }
}
