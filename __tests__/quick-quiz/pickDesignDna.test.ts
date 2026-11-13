import { describe, expect, test } from 'vitest'
import { buildTeamBrief } from '@/lib/quick-quiz/buildTeamBrief'
import { pickDesignDna } from '@/lib/quick-quiz/designDna'
import { loadQuizData, loadSampleSubmissions } from '@/lib/quick-quiz/load'
import { scoreArchetypes } from '@/lib/quick-quiz/scoreArchetypes'
import type { ArchetypeBlend } from '@/lib/quick-quiz/types'

const data = loadQuizData()
const nameFor = (archetype: string) => data.designDna.profiles.find((p) => p.archetype === archetype)!.name
const blendOf = (scores: [string, number][], insufficient = false): ArchetypeBlend => ({
  scores: scores.map(([id, percent]) => ({ id, label: id, points: percent, percent })),
  insufficient,
})

describe('pickDesignDna', () => {
  for (const sample of loadSampleSubmissions()) {
    test(`${sample.id}: the profile matches the brief's client types`, () => {
      const blend = scoreArchetypes(sample, data.questions, data.archetypes, data.signalRules)
      const dna = pickDesignDna(blend, data.designDna)
      const highlights = buildTeamBrief(sample, data).highlights
      if (highlights.length === 0) {
        expect(dna).toBeNull()
        return
      }
      expect(dna?.name).toBe(nameFor(highlights[0].id))
      expect(dna?.secondary?.name ?? null).toBe(highlights[1] ? nameFor(highlights[1].id) : null)
    })
  }

  test('gives the words and labels for the screen, and nothing about client types', () => {
    const dna = pickDesignDna(blendOf([['analytical_validator', 60], ['hands_on_controller', 40]]), data.designDna)
    expect(dna).toEqual({
      label: 'DESIGN DNA',
      name: 'The Strategist',
      headline: 'You feel most confident when every choice has a reason.',
      description: expect.stringContaining('weigh the trade-offs'),
      secondary: { label: 'SECONDARY TRAIT', name: 'The Curator' },
    })
  })

  test('the secondary trait shows from 20%, not below', () => {
    const at20 = blendOf([['decisive_delegator', 80], ['creative_collaborator', 20]])
    const at19 = blendOf([['decisive_delegator', 81], ['creative_collaborator', 19]])
    expect(pickDesignDna(at20, data.designDna)?.secondary?.name).toBe('The Explorer')
    expect(pickDesignDna(at19, data.designDna)?.secondary).toBeNull()
  })

  test('a tie goes to the type listed first in the scores (archetypes.json order)', () => {
    const tie = blendOf([['cautious_reassurance_seeker', 50], ['hands_on_controller', 50]])
    const dna = pickDesignDna(tie, data.designDna)
    expect(dna?.name).toBe('The Nest Builder')
    expect(dna?.secondary?.name).toBe('The Curator')
  })

  test('not enough answers: no profile', () => {
    expect(pickDesignDna(blendOf([['decisive_delegator', 0]], true), data.designDna)).toBeNull()
  })
})
