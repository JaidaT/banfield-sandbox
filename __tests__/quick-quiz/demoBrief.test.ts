import { describe, expect, test } from 'vitest'
import demoBriefJson from '@/data/quick-quiz/demo-brief.json'
import { loadDemoBrief, parseDemoBrief } from '@/lib/quick-quiz/demoBrief'
import { loadQuestions, loadSampleSubmissions } from '@/lib/quick-quiz/load'

// Demo styling (2026-11-17): made-up brief data for the presentation, kept
// apart from real answers (data/quick-quiz/demo-brief.json).
const questionIds = loadQuestions().map((q) => q.id)
const sampleIds = loadSampleSubmissions().map((s) => s.id)
const raw = demoBriefJson as unknown as Record<string, unknown> & { sections: { title: string; rows: { question: string; label: string }[] }[] }

describe('demo-brief.json (the real file)', () => {
  test('every sample has a made-up meeting line', () => {
    const demo = loadDemoBrief()
    for (const id of sampleIds) expect(demo.meetings[id], id).toMatch(/^\w{3} \d{1,2}:\d{2}(am|pm) - .+, .+$/)
    expect(demo.meetings['decisive-delegator']).toBe('Tue 10:30am - Renovation, Burnaby')
  })

  test('the four answer sections hold every quiz question once, with the approved short labels', () => {
    const demo = loadDemoBrief()
    expect(demo.sections.map((s) => s.title)).toEqual(['Project', 'Investment + readiness', 'Confidence + home', 'Decision making'])
    expect(demo.sections.flatMap((s) => s.rows.map((r) => `${r.question}=${r.label}`))).toEqual([
      'project_scope=Dreaming up',
      'timeframe=Timing',
      'service=Type of help',
      'anything_else=Anything else',
      'investment=Investment',
      'readiness=Project stage',
      'confidence=Feels confident',
      'home_meaning=Home means',
      'coffee=Coffee',
      'decision_style=Big decisions',
      'involvement=Involvement',
      'different_concept=New concept',
    ])
  })

  test('the inspiration photos are the three stock photos', () => {
    expect(loadDemoBrief().inspiration.map((p) => p.src)).toEqual([
      '/demo-photos/inspiration-1.jpg',
      '/demo-photos/inspiration-2.jpg',
      '/demo-photos/inspiration-3.jpg',
    ])
  })
})

describe('parseDemoBrief', () => {
  const parse = (change: Record<string, unknown>) => () => parseDemoBrief({ ...raw, ...change }, questionIds, sampleIds)
  const sectionsWith = (rows: { question: string; label: string }[]) => [{ title: 'All', rows }]
  const allRows = raw.sections.flatMap((s) => s.rows)

  test('throws when a quiz question is missing from the sections', () => {
    expect(parse({ sections: sectionsWith(allRows.slice(1)) })).toThrow(/project_scope.*not in any section/)
  })

  test('throws when a question is in two sections, or is not a quiz question', () => {
    expect(parse({ sections: sectionsWith([...allRows, allRows[0]]) })).toThrow(/project_scope.*more than once/)
    expect(parse({ sections: sectionsWith([...allRows, { question: 'mystery', label: 'Mystery' }]) })).toThrow(/unknown question.*mystery/)
  })

  test('throws when a sample has no meeting line', () => {
    const meetings = { ...(raw.meetings as Record<string, string>) }
    delete meetings.skipper
    expect(parse({ meetings })).toThrow(/skipper.*meeting/)
  })

  test('throws on a blank label or a curly apostrophe', () => {
    expect(parse({ sections: sectionsWith(allRows.map((r, i) => (i === 0 ? { ...r, label: '' } : r))) })).toThrow(/label/)
    expect(parse({ sections: sectionsWith(allRows.map((r, i) => (i === 0 ? { ...r, label: 'Dreamin\u2019' } : r))) })).toThrow(/plain characters/)
  })
})
