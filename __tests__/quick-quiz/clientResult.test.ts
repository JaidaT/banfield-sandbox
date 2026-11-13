import { describe, expect, test } from 'vitest'
import { buildClientResult } from '@/lib/quick-quiz/buildClientResult'
import { designDnaFor } from '@/lib/quick-quiz/designDna'
import { loadClientCopy, loadQuizData, loadSampleSubmissions, loadSegments, parseClientCopy } from '@/lib/quick-quiz/load'
import type { Submission } from '@/lib/quick-quiz/types'

const data = loadQuizData()
const copy = loadClientCopy()
const samples = loadSampleSubmissions()

const build = (s: Submission) => buildClientResult(s, copy, designDnaFor(s, data))

function resultFor(id: string) {
  const sample = samples.find((s) => s.id === id)
  if (!sample) throw new Error(`no sample ${id}`)
  return build(sample)
}

describe('buildClientResult', () => {
  test("uses the mockup's wording (2026-11-13)", () => {
    const result = resultFor('decisive-delegator')
    expect(result.completeLabel).toBe('Questionnaire complete')
    expect(result.heading).toBe("You're all done!")
    expect(result.intro).toBe("Here's what your answers reveal about your design approach.")
    expect(result.next).toEqual({
      title: 'What happens next',
      text: 'Jamie can use your results to prepare for a first conversation about your project.',
    })
    expect(result.thanks).toEqual({ title: 'Thank you!', text: 'You may now exit this screen.' })
  })

  test('carries the Design DNA it is given, and none when given none', () => {
    const strategist = resultFor('analytical-validator').designDna
    expect(strategist?.name).toBe('The Strategist')
    expect(strategist?.secondary?.name).toBe('The Curator')
    const s = samples[0]
    expect(buildClientResult(s, copy, null).designDna).toBeNull()
  })

  test('no longer shows the old greeting or answer sections', () => {
    const result = resultFor('mixed-cautious-controller') as unknown as Record<string, unknown>
    for (const gone of ['greeting', 'sections', 'closing']) expect(result).not.toHaveProperty(gone)
    expect(JSON.stringify(result)).not.toContain('Somewhere the kids can grow up')
  })

  test('always has a booking button that pre-fills name and email (P5)', () => {
    for (const s of samples) {
      const result = build(s)
      expect(result.cta.label, s.id).toBe('Book your Meet + Inspire with Jamie')
      expect(result.cta.href, s.id).toContain(`name=${encodeURIComponent(s.contact.name)}`)
      expect(result.cta.href, s.id).toContain(`email=${encodeURIComponent(s.contact.email)}`)
    }
  })

  test('the booking link leaves out a blank name or email', () => {
    const s = samples.find((x) => x.id === 'decisive-delegator')!
    const noName = { ...s, contact: { ...s.contact, name: '  ' } }
    const result = build(noName)
    expect(result.cta.href).not.toContain('name=')
    expect(result.cta.href).toContain(`email=${encodeURIComponent(s.contact.email)}`)
    const nothing = { ...s, contact: { ...s.contact, name: '', email: '' } }
    expect(build(nothing).cta.href).toBe(copy.cta.bookingUrl)
  })

  // DISCOVERY P3 and P6: archetype and fit labels are team-only.
  test('never includes archetype, segment or fit information', () => {
    const forbidden = [
      ...data.archetypes.flatMap((a) => [a.id, a.label.replace(/^The /, ''), a.tagline]),
      ...Object.keys(loadSegments()),
      ...Object.values(loadSegments()),
      ...data.leadRules.warningSigns.map((f) => f.note),
    ].map((s) => s.toLowerCase())
    for (const s of samples) {
      const result = build(s)
      // The booking URL is percent-encoded, so check the readable text without it.
      const text = JSON.stringify({ ...result, cta: { ...result.cta, href: '' } }).toLowerCase()
      for (const word of forbidden) expect(text, `${s.id} leaks "${word}"`).not.toContain(word)
      expect(text, s.id).not.toMatch(/\b(fit|archetype|percent)\b|\b(hot|warm|cold) lead\b|%/)
    }
  })

  // BRAND_NOTES.md: words Banfield avoids.
  test('never uses words Banfield avoids', () => {
    for (const s of samples) {
      const text = JSON.stringify(build(s)).toLowerCase()
      for (const word of ['luxury', 'guaranteed', 'risk-free']) {
        expect(text, `${s.id} uses "${word}"`).not.toContain(word)
      }
    }
  })
})

describe('parseClientCopy', () => {
  test('throws when a required piece of copy is missing', () => {
    expect(() => parseClientCopy({ ...copy, heading: "" })).toThrow(/heading/)
  })
})
