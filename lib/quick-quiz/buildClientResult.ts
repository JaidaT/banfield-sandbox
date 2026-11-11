import { answerLabels } from './answers'
import type { ClientCopy, ClientResult, Question, Submission } from './types'

function labelsFor(question: Question | undefined, submission: Submission): string[] {
  return question ? answerLabels(question, submission.answers[question.id]) : []
}

// Adds the name and email to the booking link so the booking form is pre-filled.
// Blank ones are left out, since the result can show before contact details.
function bookingHref(base: string, name: string, email: string): string {
  const params = [
    ['name', name.trim()],
    ['email', email.trim()],
  ]
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
  if (params.length === 0) return base
  return `${base}${base.includes('?') ? '&' : '?'}${params.join('&')}`
}

// "Thanks, {firstName}. ..." with the first name, or "Thanks. ..." with no name.
function greet(greeting: string, firstName: string): string {
  if (firstName !== '') return greeting.replace('{firstName}', firstName)
  // No name: drop the placeholder and the comma and spaces before it.
  return greeting.replace(/,?\s*\{firstName\}/, '')
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
    greeting: greet(copy.greeting, firstName),
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
