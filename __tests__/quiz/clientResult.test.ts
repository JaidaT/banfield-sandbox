import { describe, expect, test } from 'vitest'
import { buildClientResult } from '@/lib/quiz/buildClientResult'
import { loadClientCopy, loadQuizData, loadSampleSubmissions, loadSegments, parseClientCopy } from '@/lib/quiz/load'

const data = loadQuizData()
const copy = loadClientCopy()
const samples = loadSampleSubmissions()

function resultFor(id: string) {
  const sample = samples.find((s) => s.id === id)
  if (!sample) throw new Error(`no sample ${id}`)
  return buildClientResult(sample, data.questions, copy)
}

describe('buildClientResult', () => {
  test('greets the client by first name', () => {
    expect(resultFor('decisive-delegator').greeting).toContain('Alex')
  })

  test('reflects their project from their own answers', () => {
    const text = JSON.stringify(resultFor('analytical-validator'))
    expect(text).toContain('A new build')
    expect(text).toContain('In 6 to 12 months')
  })

  test('reflects what builds their confidence', () => {
    expect(JSON.stringify(resultFor('decisive-delegator'))).toContain(
      'A clear recommendation from someone experienced',
    )
  })

  test('quotes what home means to them, and leaves it out when skipped', () => {
    expect(JSON.stringify(resultFor('mixed-cautious-controller'))).toContain(
      'Somewhere the kids can grow up and my mom can come stay with us.',
    )
    const skipper = resultFor('skipper')
    expect(skipper.sections.map((s) => s.title)).not.toContain(copy.homeTitle)
  })

  test('always ends warmly with a booking CTA that pre-fills name and email (P5)', () => {
    for (const s of samples) {
      const result = buildClientResult(s, data.questions, copy)
      expect(result.closing, s.id).toMatch(/love to work with you/i)
      expect(result.cta.href, s.id).toContain(`name=${encodeURIComponent(s.contact.name)}`)
      expect(result.cta.href, s.id).toContain(`email=${encodeURIComponent(s.contact.email)}`)
      expect(result.cta.fallback, s.id).toBeTruthy()
    }
  })

  // DISCOVERY P3 and P6: archetype and fit labels are team-only.
  test('never includes archetype, segment or fit information', () => {
    const forbidden = [
      ...data.archetypes.flatMap((a) => [a.id, a.label.replace(/^The /, ''), a.tagline]),
      ...Object.keys(loadSegments()),
      ...Object.values(loadSegments()),
      ...data.fitRules.redFlags.map((f) => f.note),
    ].map((s) => s.toLowerCase())
    for (const s of samples) {
      const result = buildClientResult(s, data.questions, copy)
      // The booking URL is percent-encoded, so check the readable text without it.
      const text = JSON.stringify({ ...result, cta: { ...result.cta, href: '' } }).toLowerCase()
      for (const word of forbidden) expect(text, `${s.id} leaks "${word}"`).not.toContain(word)
      expect(text, s.id).not.toMatch(/\b(fit|archetype|percent)\b|%/)
    }
  })

  // BRAND_NOTES.md: words Banfield avoids.
  test('never uses words Banfield avoids', () => {
    for (const s of samples) {
      const text = JSON.stringify(buildClientResult(s, data.questions, copy)).toLowerCase()
      for (const word of ['luxury', 'guaranteed', 'risk-free']) {
        expect(text, `${s.id} uses "${word}"`).not.toContain(word)
      }
    }
  })
})

describe('parseClientCopy', () => {
  test('throws when a required piece of copy is missing', () => {
    expect(() => parseClientCopy({ ...copy, closing: '' })).toThrow(/closing/)
  })
})
