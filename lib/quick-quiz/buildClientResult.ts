import type { ClientCopy, ClientDesignDna, ClientResult, Submission } from './types'

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

// Client-facing result, laid out like the team's mockup (2026-11-13). Built
// from the copy file, the contact details (for the booking link) and the
// Design DNA words only: it never receives client type or fit data, so it
// cannot leak them. Pick the Design DNA with designDnaFor.
export function buildClientResult(
  submission: Submission,
  copy: ClientCopy,
  designDna: ClientDesignDna | null,
): ClientResult {
  return {
    completeLabel: copy.completeLabel,
    heading: copy.heading,
    intro: copy.intro,
    designDna,
    next: { title: copy.next.title, text: copy.next.text },
    cta: {
      label: copy.cta.label,
      href: bookingHref(copy.cta.bookingUrl, submission.contact.name, submission.contact.email),
    },
    thanks: { title: copy.thanks.title, text: copy.thanks.text },
  }
}
