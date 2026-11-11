import { describe, expect, test } from 'vitest'
import { briefToText } from '@/lib/quick-quiz/briefToText'
import { buildTeamBrief } from '@/lib/quick-quiz/buildTeamBrief'
import { loadQuizData, loadSampleSubmissions } from '@/lib/quick-quiz/load'

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

  test('headline puts the lead label first, then the leading client type', () => {
    expect(briefFor('decisive-delegator').headline).toMatch(/^Hot lead \| \d+% Decisive Delegator/)
    expect(briefFor('cold-explorer').headline).toMatch(/^Cold lead \| \d+% Creative Collaborator/)
  })

  test('shows guidance for at most two client types', () => {
    for (const s of samples) expect(buildTeamBrief(s, data).highlights.length, s.id).toBeLessThanOrEqual(2)
  })

  test('highlights the top types (20% or more) with guidance from archetypes.json', () => {
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
    expect(brief.behaviour.skippedQuestions).not.toContain('Anything else we missed?')
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

  test('shows investment amounts as money, "$500K+" at the top, and "Not sure yet"', () => {
    const investment = (id: string) => briefFor(id).answers.find((a) => a.questionId === 'investment')?.answer
    expect(investment('decisive-delegator')).toBe('$200K')
    expect(investment('analytical-validator')).toBe('$500K+')
    expect(investment('cold-explorer')).toBe('Not sure yet')
  })

  test('includes the lead assessment with its warning signs', () => {
    const brief = briefFor('cold-explorer')
    expect(brief.lead.temperature).toBe('cold')
    expect(brief.lead.warningSigns.length).toBe(3)
  })
})

describe('blank contact details (contactRequired: false)', () => {
  const sample = samples.find((s) => s.id === 'cold-explorer')!
  const withContact = (contact: Partial<typeof sample.contact>, site: Partial<typeof sample.contact.siteAddress> = {}) =>
    buildTeamBrief(
      { ...sample, contact: { ...sample.contact, ...contact, siteAddress: { ...sample.contact.siteAddress, ...site } } },
      data,
    )

  test('the copied text says "Not given" for each blank detail', () => {
    const text = briefToText(withContact({ name: '', email: '', phone: '' }, { street: '', city: '', postalCode: '' }))
    expect(text).toContain('PRE-CALL BRIEF: Name not given')
    for (const line of ['Name: Not given', 'Email: Not given', 'Phone: Not given', 'Site: Not given']) {
      expect(text).toContain(line)
    }
  })

  test('a partly filled-in site address shows only the parts given', () => {
    expect(briefToText(withContact({}, { street: '' }))).toContain('Site: Kelowna, V1Y 0A4')
  })
})

describe('briefToText', () => {
  test('includes contact details, headline, guidance and fit notes', () => {
    const brief = briefFor('cold-explorer')
    const text = briefToText(brief)
    for (const expected of [
      'Riley Thompson',
      'riley.thompson@example.com',
      '250-555-0104',
      '400 Demo Cres, Kelowna, V1Y 0A4',
      brief.headline,
      brief.highlights[0].communication,
      brief.lead.warningSigns[0].note,
    ]) {
      expect(text).toContain(expected)
    }
  })

  test('the lead section comes before the client type guidance', () => {
    const text = briefToText(briefFor('skipper'))
    expect(text).toContain('LEAD: WARM')
    expect(text.indexOf('LEAD:')).toBeLessThan(text.indexOf('HOW TO WORK WITH THEM'))
    expect(text).toContain('- Investment: $250K')
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
