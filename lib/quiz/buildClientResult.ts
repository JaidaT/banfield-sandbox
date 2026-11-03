import { answerLabels } from './answers'
import type { ClientCopy, ClientResult, Question, Submission } from './types'

function labelsFor(question: Question | undefined, submission: Submission): string[] {
  return question ? answerLabels(question, submission.answers[question.id]) : []
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
    labelsFor(byId.get(question), submission).map((label) => `${prefix}${label}`),
  )
  if (projectLines.length > 0) sections.push({ title: copy.projectTitle, lines: projectLines })

  const confidence = labelsFor(byId.get(copy.confidenceQuestion), submission)
  if (confidence.length > 0) sections.push({ title: copy.confidenceTitle, lines: confidence })

  const home = labelsFor(byId.get(copy.homeQuestion), submission)
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
