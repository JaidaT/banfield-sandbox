import { describe, expect, test } from 'vitest'
import { briefToText } from '@/lib/quiz/briefToText'
import { buildTeamBrief } from '@/lib/quiz/buildTeamBrief'
import { loadQuizData, loadSampleSubmissions } from '@/lib/quiz/load'

const data = loadQuizData()
const samples = loadSampleSubmissions()

function briefFor(id: string) {
  const sample = samples.find((s) => s.id === id)
  if (!sample) throw new Error(`no sample ${id}`)
  return buildTeamBrief(sample, data)
}

describe('buildTeamBrief', () => {
  test('carries the contact details through (DISCOVERY P1)', () => {
    const brief = briefFor('decisive-delegator')
    expect(brief.contact).toEqual(samples[0].contact)
  })

  test('headline names the leading client type and the fit', () => {
    expect(briefFor('decisive-delegator').headline).toMatch(/^\d+% Decisive Delegator.*Strong fit$/)
    expect(briefFor('weak-fit-explorer').headline).toMatch(/Creative Collaborator.*Weak fit$/)
  })

  test('highlights the top types (20% or more, at most three) with guidance from archetypes.json', () => {
    const brief = briefFor('mixed-cautious-controller')
    const ids = brief.highlights.map((h) => h.id)
    expect(ids).toEqual(['cautious_reassurance_seeker', 'hands_on_controller'])
    const cautious = data.archetypes.find((a) => a.id === 'cautious_reassurance_seeker')
    expect(brief.highlights[0]).toMatchObject({
      communication: cautious?.communication,
      pacing: cautious?.pacing,
      pitch: cautious?.pitch,
      risks: cautious?.risks,
    })
    for (const h of brief.highlights) expect(h.percent).toBeGreaterThanOrEqual(20)
    expect(brief.highlights.length).toBeLessThanOrEqual(3)
  })

  test('always highlights at least the top type when there is any data', () => {
    for (const s of samples) expect(buildTeamBrief(s, data).highlights.length, s.id).toBeGreaterThan(0)
  })

  test('says so when there is not enough information to type the client', () => {
    const blank = { ...samples[0], answers: {} }
    const brief = buildTeamBrief(blank, data)
    expect(brief.highlights).toEqual([])
    expect(brief.headline).toMatch(/not enough/i)
  })

  test('lists skipped questions by their prompt and includes behaviour notes', () => {
    const brief = briefFor('skipper')
    expect(brief.behaviour.skippedQuestions).toHaveLength(3)
    expect(brief.behaviour.skippedQuestions).toContain('What does home mean to you?')
    expect(brief.behaviour.notes).toContain('Skipped 2 or more questions')
    expect(brief.behaviour.notes).toContain('Finished quickly (under 2.5 minutes)')
  })

  test('includes every question with readable answers, and null for skipped ones', () => {
    const brief = briefFor('skipper')
    expect(brief.answers).toHaveLength(data.questions.length)
    expect(brief.answers.find((a) => a.questionId === 'coffee')?.answer).toBeNull()
    const confidence = briefFor('decisive-delegator').answers.find((a) => a.questionId === 'confidence')
    expect(confidence?.answer).toBe(
      'A clear recommendation from someone experienced; Knowing exactly where the budget is going',
    )
  })

  test('includes the fit assessment with its red flags', () => {
    const brief = briefFor('weak-fit-explorer')
    expect(brief.fit.overall).toBe('weak')
    expect(brief.fit.redFlags.length).toBe(2)
  })
})

describe('briefToText', () => {
  test('includes contact details, headline, guidance and fit notes', () => {
    const brief = briefFor('weak-fit-explorer')
    const text = briefToText(brief)
    for (const expected of [
      'Riley Thompson',
      'riley.thompson@example.com',
      '250-555-0104',
      '400 Demo Cres, Kelowna, V1Y 0A4',
      brief.headline,
      brief.highlights[0].communication,
      brief.fit.redFlags[0].note,
    ]) {
      expect(text).toContain(expected)
    }
  })

  test('marks skipped answers', () => {
    expect(briefToText(briefFor('skipper'))).toMatch(/how do you take your coffee\?\n.*\(skipped\)/i)
  })

  // CLAUDE.md: no special Unicode in output, so pasted text stays clean everywhere.
  test('uses plain ASCII only', () => {
    for (const s of samples) {
      expect(briefToText(buildTeamBrief(s, data)), s.id).toMatch(/^[\x20-\x7E\n]*$/)
    }
  })
})
