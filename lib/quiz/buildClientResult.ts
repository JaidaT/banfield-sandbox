import type { ClientCopy, ClientResult, Question, Submission } from './types'

function answerLabels(question: Question | undefined, submission: Submission): string[] {
  if (!question) return []
  const answer = submission.answers[question.id]
  if (answer === undefined) return []
  if (question.kind === 'text') {
    return typeof answer === 'string' && answer.trim() !== '' ? [answer.trim()] : []
  }
  const chosen = Array.isArray(answer) ? answer : [answer]
  return question.options.filter((o) => chosen.includes(o.id)).map((o) => o.label)
}

function bookingHref(base: string, name: string, email: string): string {
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`
}

// Client-facing result. Built only from the client's own answers and the copy
// file: it never receives archetype or fit data, so it cannot leak them.
export function buildClientResult(
  submission: Submission,
  questions: Question[],
  copy: ClientCopy,
): ClientResult {
  const byId = new Map(questions.map((q) => [q.id, q]))
  const firstName = submission.contact.name.trim().split(/\s+/)[0] ?? ''
  const sections: ClientResult['sections'] = []

  const projectLines = copy.projectLines.flatMap(({ question, prefix }) =>
    answerLabels(byId.get(question), submission).map((label) => `${prefix}${label}`),
  )
  if (projectLines.length > 0) sections.push({ title: copy.projectTitle, lines: projectLines })

  const confidence = answerLabels(byId.get(copy.confidenceQuestion), submission)
  if (confidence.length > 0) sections.push({ title: copy.confidenceTitle, lines: confidence })

  const home = answerLabels(byId.get(copy.homeQuestion), submission)
  if (home.length > 0) sections.push({ title: copy.homeTitle, lines: home })

  return {
    greeting: copy.greeting.replace('{firstName}', firstName),
    intro: copy.intro,
    sections,
    closing: copy.closing,
    cta: {
      label: copy.cta.label,
      text: copy.cta.text,
      href: bookingHref(copy.cta.bookingUrl, submission.contact.name, submission.contact.email),
      fallback: copy.cta.fallback,
    },
  }
}
