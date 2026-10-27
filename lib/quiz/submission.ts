import type { Answer, Question, Submission } from './types'

function checkAnswer(question: Question, answer: Answer): string | null {
  const optionIds = new Set(question.options.map((o) => o.id))

  if (question.kind === 'text') {
    return typeof answer === 'string' ? null : `answer to ${question.id} must be text`
  }
  if (question.kind === 'single') {
    if (typeof answer !== 'string') return `answer to ${question.id} must be a single option`
    return optionIds.has(answer) ? null : `answer to ${question.id} is not an option: ${answer}`
  }
  if (!Array.isArray(answer)) return `answer to ${question.id} must be a list of options`
  const unknown = answer.find((id) => !optionIds.has(id))
  if (unknown !== undefined) return `answer to ${question.id} is not an option: ${unknown}`
  if (question.maxSelections !== undefined && answer.length > question.maxSelections) {
    return `answer to ${question.id} picks more than ${question.maxSelections} options`
  }
  return null
}

// Returns every problem found rather than throwing on the first, so a form or
// a test can show them all. Unanswered questions are allowed: skipping is a
// behavioural signal (DISCOVERY P2), not an error.
export function validateSubmission(submission: Submission, questions: Question[]): string[] {
  const problems: string[] = []
  const { contact } = submission

  for (const field of ['name', 'email', 'phone'] as const) {
    if (!contact[field]?.trim()) problems.push(`contact ${field} is required`)
  }
  if (contact.email && !contact.email.includes('@')) {
    problems.push(`contact email looks invalid: ${contact.email}`)
  }
  for (const field of ['street', 'city', 'postalCode'] as const) {
    if (!contact.siteAddress?.[field]?.trim()) problems.push(`site address ${field} is required`)
  }
  if (!Number.isFinite(submission.durationSeconds) || submission.durationSeconds < 0) {
    problems.push('duration must be zero or more seconds')
  }

  const byId = new Map(questions.map((q) => [q.id, q]))
  for (const [questionId, answer] of Object.entries(submission.answers)) {
    const question = byId.get(questionId)
    if (!question) {
      problems.push(`answer given to unknown question: ${questionId}`)
      continue
    }
    const problem = checkAnswer(question, answer)
    if (problem) problems.push(problem)
  }
  return problems
}
