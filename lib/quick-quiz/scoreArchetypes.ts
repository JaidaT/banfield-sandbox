import { evaluateSignals } from './signals'
import type {
  Archetype,
  ArchetypeBlend,
  ArchetypeScore,
  Question,
  SignalRule,
  Submission,
  Weights,
} from './types'

function addWeights(points: Map<string, number>, weights: Weights): void {
  for (const [id, weight] of Object.entries(weights)) {
    if (points.has(id) && weight !== undefined) points.set(id, (points.get(id) ?? 0) + weight)
  }
}

// Largest-remainder rounding, so whole-number percentages always add up to 100.
// Remainder ties go to the archetype listed first.
function toPercents(points: number[]): number[] {
  const positive = points.map((p) => Math.max(0, p))
  const total = positive.reduce((sum, p) => sum + p, 0)
  if (total === 0) return points.map(() => 0)
  const exact = positive.map((p) => (p / total) * 100)
  const percents = exact.map(Math.floor)
  let left = 100 - percents.reduce((sum, p) => sum + p, 0)
  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((x, y) => y.remainder - x.remainder || x.index - y.index)
  for (const { index } of byRemainder) {
    if (left === 0) break
    percents[index] += 1
    left -= 1
  }
  return percents
}

export function scoreArchetypes(
  submission: Submission,
  questions: Question[],
  archetypes: Archetype[],
  signalRules: SignalRule[],
): ArchetypeBlend {
  const points = new Map(archetypes.map((a) => [a.id, 0]))

  for (const question of questions) {
    const answer = submission.answers[question.id]
    if (answer === undefined || question.kind === 'text') continue
    const chosen = Array.isArray(answer) ? answer : [answer]
    for (const option of question.options) {
      if (chosen.includes(option.id)) addWeights(points, option.weights)
    }
  }
  for (const rule of evaluateSignals(submission, questions, signalRules).matched) {
    addWeights(points, rule.weights)
  }

  const raw = archetypes.map((a) => points.get(a.id) ?? 0)
  const percents = toPercents(raw)
  const scores: ArchetypeScore[] = archetypes.map((a, i) => ({
    id: a.id,
    label: a.label,
    points: raw[i],
    percent: percents[i],
  }))
  // Array.prototype.sort is stable, so ties keep archetypes.json order.
  scores.sort((x, y) => y.points - x.points)

  return { scores, insufficient: raw.every((p) => p <= 0) }
}
