import { shortLabel } from './buildTeamBrief'
import type { Contact, SiteAddress, TeamBrief } from './types'

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes === 0 ? `${rest} s` : `${minutes} min ${rest} s`
}

// A contact detail, or "Not given" when it was left blank (the quiz can show
// the result before contact details; see contactRequired in data/quick-quiz/quiz-form.json).
export function shownOrNotGiven(value: string): string {
  return value.trim() === '' ? 'Not given' : value.trim()
}

// The site address on one line, leaving out any blank parts.
export function siteText(site: SiteAddress): string {
  const parts = [site.street, site.city, site.postalCode].map((p) => p.trim()).filter((p) => p !== '')
  return parts.length > 0 ? parts.join(', ') : 'Not given'
}

// The brief's title: the person's name, or "Name not given".
export function briefName(contact: Contact): string {
  return contact.name.trim() === '' ? 'Name not given' : contact.name.trim()
}

// Plain-text version of the brief for pasting into Claude or JobTread.
// ASCII only, so it pastes cleanly anywhere.
export function briefToText(brief: TeamBrief): string {
  const { contact, lead, behaviour } = brief
  const lines: string[] = [
    `PRE-CALL BRIEF: ${briefName(contact)}`,
    brief.headline,
    ...brief.closeCalls,
    '',
    'CONTACT',
    `Name: ${shownOrNotGiven(contact.name)}`,
    `Email: ${shownOrNotGiven(contact.email)}`,
    `Phone: ${shownOrNotGiven(contact.phone)}`,
    `Site: ${siteText(contact.siteAddress)}`,
    '',
    `LEAD: ${lead.temperature.toUpperCase()}`,
    ...lead.reasons,
  ]
  for (const d of lead.details) lines.push(`- ${d.label}: ${d.answer ?? 'not answered'}`)
  for (const flag of lead.warningSigns) lines.push(`! ${flag.note}`)

  lines.push('', 'HOW TO WORK WITH THEM')
  if (brief.highlights.length === 0) lines.push('Not enough answers to identify a client type.')
  for (const h of brief.highlights) {
    lines.push(
      `${shortLabel(h.label)} (${h.percent}%)`,
      `  Communication: ${h.communication}`,
      `  Pacing: ${h.pacing}`,
      `  Pitch: ${h.pitch}`,
      `  Risks: ${h.risks.join('; ')}`,
    )
    if (h.tip) lines.push(`  Tip: ${h.tip}`)
  }

  lines.push('', 'BEHAVIOUR', `Time to complete: ${formatDuration(behaviour.durationSeconds)}`)
  lines.push(
    behaviour.skippedQuestions.length === 0
      ? 'Skipped: none'
      : `Skipped (${behaviour.skippedQuestions.length}): ${behaviour.skippedQuestions.join(' / ')}`,
  )
  for (const note of behaviour.notes) lines.push(`- ${note}`)

  lines.push('', 'ANSWERS')
  for (const a of brief.answers) lines.push(a.prompt, `  ${a.answer ?? '(skipped)'}`)

  return lines.join('\n')
}
