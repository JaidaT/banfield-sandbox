import { formatDate } from '@/lib/form/format'
import { briefName } from './briefToText'
import { buildTeamBrief, clientTypeLine } from './buildTeamBrief'
import { loadQuizData, loadSampleSubmissions } from './load'
import type { LeadTemperature, QuizData, SampleSubmission } from './types'

// One row in the team's list of Quick Quiz results: what a reviewer scans for
// before opening a brief. Shaped like the real submissions list will be.
export interface QuickQuizRow {
  id: string
  name: string
  // "Nov 10, 2026"
  date: string
  temperature: LeadTemperature
  // As in the brief's headline, e.g. "80% Decisive Delegator".
  typeLine: string
  closeCall: boolean
  // The sample's testing note (prototype only).
  note: string
}

// The sample results as list rows, newest first.
export function quickQuizRows(
  samples: SampleSubmission[] = loadSampleSubmissions(),
  data: QuizData = loadQuizData(),
): QuickQuizRow[] {
  return [...samples]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .map((sample) => {
      const brief = buildTeamBrief(sample, data)
      return {
        id: sample.id,
        name: briefName(sample.contact),
        date: formatDate(sample.submittedAt),
        temperature: brief.lead.temperature,
        typeLine: clientTypeLine(brief.highlights),
        closeCall: brief.closeCalls.length > 0,
        note: sample.note,
      }
    })
}
