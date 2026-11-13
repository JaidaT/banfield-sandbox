import { describe, expect, test } from 'vitest'
import { buildTeamBrief } from '@/lib/quick-quiz/buildTeamBrief'
import { loadQuizData, loadSampleSubmissions } from '@/lib/quick-quiz/load'
import { quickQuizRows } from '@/lib/quick-quiz/sampleList'

const data = loadQuizData()
const samples = loadSampleSubmissions()
const rows = quickQuizRows()

describe('quickQuizRows', () => {
  test('one row per sample, newest first', () => {
    expect(rows.map((r) => r.id)).toEqual([
      'out-of-area-hot',
      'decisive-delegator',
      'analytical-validator',
      'mixed-cautious-controller',
      'cold-explorer',
      'skipper',
    ])
    expect(rows[0].date).toBe('Nov 10, 2026')
  })

  test("each row's name, lead label and client type match its brief", () => {
    for (const row of rows) {
      const brief = buildTeamBrief(samples.find((s) => s.id === row.id)!, data)
      expect(row.name, row.id).toBe(brief.contact.name)
      expect(row.temperature, row.id).toBe(brief.lead.temperature)
      expect(brief.headline, row.id).toBe(`${row.temperature[0].toUpperCase()}${row.temperature.slice(1)} lead | ${row.typeLine}`)
    }
  })

  // Close calls show only inside the brief, not on the list (Jaida, 2026-11-13).
  test('rows carry no close-call marker', () => {
    for (const row of rows) expect(row, row.id).not.toHaveProperty('closeCall')
  })

  test('each row keeps its test note', () => {
    for (const row of rows) expect(row.note, row.id).toBe(samples.find((s) => s.id === row.id)!.note)
  })

  test('a blank name reads "Name not given"', () => {
    const blank = { ...samples[0], contact: { ...samples[0].contact, name: '' } }
    expect(quickQuizRows([blank], data)[0].name).toBe('Name not given')
  })
})
