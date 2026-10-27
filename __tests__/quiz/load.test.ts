import { describe, expect, test } from 'vitest'
import { loadArchetypes, parseArchetypes } from '@/lib/quiz/load'

describe('loadArchetypes', () => {
  test('loads every archetype from data/archetypes.json', () => {
    const archetypes = loadArchetypes()
    expect(archetypes.map((a) => a.id)).toEqual([
      'decisive_delegator',
      'analytical_validator',
      'cautious_reassurance_seeker',
      'creative_collaborator',
      'hands_on_controller',
    ])
  })

  test('each archetype has the guidance fields the team brief needs', () => {
    for (const a of loadArchetypes()) {
      expect(a.label).toBeTruthy()
      expect(a.communication).toBeTruthy()
      expect(a.pacing).toBeTruthy()
      expect(a.pitch).toBeTruthy()
      expect(a.risks.length).toBeGreaterThan(0)
    }
  })
})

describe('parseArchetypes', () => {
  test('throws when an archetype is missing a required field', () => {
    const bad = { archetypes: [{ id: 'x', label: 'X' }], segments: {} }
    expect(() => parseArchetypes(bad)).toThrow(/x.*communication/)
  })

  test('throws on duplicate archetype ids', () => {
    const one = {
      id: 'dup',
      label: 'Dup',
      tagline: '',
      description: '',
      segments: [],
      signals: [],
      communication: 'c',
      pacing: 'p',
      pitch: 'p',
      risks: ['r'],
      brief_tips: '',
    }
    expect(() => parseArchetypes({ archetypes: [one, one], segments: {} })).toThrow(/duplicate.*dup/i)
  })

  test('throws when an archetype references an unknown segment', () => {
    const a = {
      id: 'a',
      label: 'A',
      tagline: '',
      description: '',
      segments: ['nowhere'],
      signals: [],
      communication: 'c',
      pacing: 'p',
      pitch: 'p',
      risks: ['r'],
      brief_tips: '',
    }
    expect(() => parseArchetypes({ archetypes: [a], segments: {} })).toThrow(/nowhere/)
  })
})
