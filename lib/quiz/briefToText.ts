import { shortLabel } from './buildTeamBrief'
import type { TeamBrief } from './types'

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes === 0 ? `${rest} s` : `${minutes} min ${rest} s`
}

// Plain-text version of the brief for pasting into Claude or JobTread.
// ASCII only, so it pastes cleanly anywhere.
export function briefToText(brief: TeamBrief): string {
  const { contact, fit, behaviour } = brief
  const site = contact.siteAddress
  const lines: string[] = [
    `PRE-CALL BRIEF: ${contact.name}`,
    brief.headline,
    '',
    'CONTACT',
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone}`,
    `Site: ${site.street}, ${site.city}, ${site.postalCode}`,
    '',
    'HOW TO WORK WITH THEM',
  ]

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

  lines.push('', `FIT: ${fit.overall.toUpperCase()}`)
  for (const c of fit.criteria) {
    lines.push(`- ${c.label}: ${c.answer ?? 'not answered'} (${c.rating})`)
  }
  for (const flag of fit.redFlags) lines.push(`! ${flag.note}`)

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
