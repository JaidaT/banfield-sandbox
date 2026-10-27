import type { Comparison, Question, SignalResult, SignalRule, SignalValues, Submission } from './types'

function compare(actual: number, op: Comparison, value: number): boolean {
  switch (op) {
    case 'lt':
      return actual < value
    case 'lte':
      return actual <= value
    case 'gt':
      return actual > value
    case 'gte':
      return actual >= value
  }
}

export function measureSignals(submission: Submission, questions: Question[]): SignalValues {
  const skippedCount = questions.filter((q) => !(q.id in submission.answers)).length
  const lengths = questions
    .filter((q) => q.kind === 'text')
    .map((q) => submission.answers[q.id])
    .filter((a): a is string => typeof a === 'string' && a.trim() !== '')
    .map((a) => a.trim().length)
  const avgTextLength =
    lengths.length === 0 ? null : Math.round(lengths.reduce((sum, n) => sum + n, 0) / lengths.length)
  return { durationSeconds: submission.durationSeconds, skippedCount, avgTextLength }
}

export function evaluateSignals(
  submission: Submission,
  questions: Question[],
  rules: SignalRule[],
): SignalResult {
  const values = measureSignals(submission, questions)
  const matched = rules.filter((rule) => {
    const actual = values[rule.signal]
    return actual !== null && compare(actual, rule.op, rule.value)
  })
  return { values, matched }
}
