import demoBriefJson from '@/data/quick-quiz/demo-brief.json'
import { isRecord, loadQuestions, loadSampleSubmissions } from './load'

// Demo styling (2026-11-17, foyer-v1-demo-styling only): made-up data for the
// Quick Quiz team brief (data/quick-quiz/demo-brief.json). Kept apart from
// real answers; nothing here comes from the quiz.

export interface DemoBriefRow {
  question: string
  label: string
}

export interface DemoBrief {
  // Made-up meeting line per sample id, e.g. "Tue 10:30am - Renovation, Burnaby".
  meetings: Record<string, string>
  inspiration: { src: string; alt: string }[]
  // The "All answers" sections, each listing quiz questions with a short label.
  sections: { title: string; rows: DemoBriefRow[] }[]
}

const PLAIN = /^[\x20-\x7E]*$/

function text(value: unknown, where: string): string {
  if (typeof value !== 'string' || value === '') throw new Error(`demo brief ${where} is missing`)
  if (!PLAIN.test(value)) throw new Error(`demo brief ${where} must use plain characters only`)
  return value
}

// Checks every sample has a meeting line and every quiz question sits in
// exactly one section.
export function parseDemoBrief(raw: unknown, questionIds: string[], sampleIds: string[]): DemoBrief {
  if (!isRecord(raw)) throw new Error('demo brief must be an object')
  const meetingsRaw = isRecord(raw.meetings) ? raw.meetings : {}
  const meetings: Record<string, string> = {}
  for (const id of sampleIds) meetings[id] = text(meetingsRaw[id], `sample ${id} meeting line`)

  const inspiration = (Array.isArray(raw.inspiration) ? raw.inspiration : []).map((p: unknown, i) => {
    const photo = isRecord(p) ? p : {}
    return { src: text(photo.src, `inspiration ${i} "src"`), alt: text(photo.alt, `inspiration ${i} "alt"`) }
  })

  const known = new Set(questionIds)
  const seen = new Set<string>()
  const sections = (Array.isArray(raw.sections) ? raw.sections : []).map((s: unknown, i) => {
    const section = isRecord(s) ? s : {}
    const rows = (Array.isArray(section.rows) ? section.rows : []).map((r: unknown, j): DemoBriefRow => {
      const row = isRecord(r) ? r : {}
      const question = text(row.question, `section ${i} row ${j} "question"`)
      if (!known.has(question)) throw new Error(`demo brief has an unknown question: ${question}`)
      if (seen.has(question)) throw new Error(`demo brief lists ${question} more than once`)
      seen.add(question)
      return { question, label: text(row.label, `section ${i} row ${j} "label"`) }
    })
    return { title: text(section.title, `section ${i} "title"`), rows }
  })
  for (const id of questionIds) {
    if (!seen.has(id)) throw new Error(`demo brief: question ${id} is not in any section`)
  }
  return { meetings, inspiration, sections }
}

export function loadDemoBrief(): DemoBrief {
  return parseDemoBrief(
    demoBriefJson as unknown,
    loadQuestions().map((q) => q.id),
    loadSampleSubmissions().map((s) => s.id),
  )
}
