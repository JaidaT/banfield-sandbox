import { describe, expect, test } from 'vitest'
import designDnaJson from '@/data/quick-quiz/design-dna.json'
import { loadArchetypes, loadDesignDna, loadQuizData, parseDesignDna } from '@/lib/quick-quiz/load'

// The team's wording (2026-11-13), exactly as written, with straight apostrophes.
const TEAM_PROFILES = [
  {
    archetype: 'hands_on_controller',
    name: 'The Curator',
    headline: 'You make a home feel unmistakably yours.',
    description:
      'You notice the details that give a space its character, and you want every choice to feel considered. You enjoy shaping the look and feel yourself, balancing visual harmony with personal touches that make the finished space feel distinctly yours.',
  },
  {
    archetype: 'creative_collaborator',
    name: 'The Explorer',
    headline: "You'd rather discover a possibility than settle for the expected.",
    description:
      "You're energized by new ideas, creative detours and seeing what a space could become. You're open to experimenting, mixing influences and considering options you hadn't imagined. The process should feel collaborative and full of discovery, not locked into a plan too early.",
  },
  {
    archetype: 'cautious_reassurance_seeker',
    name: 'The Nest Builder',
    headline: 'Home is less about how it looks and more about how it makes you feel.',
    description:
      'You approach design through the rhythms of everyday life and the people who make a place meaningful. Comfort, connection and a sense of belonging guide your choices. You want a space that supports real life while holding memories and personal meaning.',
  },
  {
    archetype: 'analytical_validator',
    name: 'The Strategist',
    headline: 'You feel most confident when every choice has a reason.',
    description:
      'You like to understand the options, weigh the trade-offs and know what comes next. A well-considered plan gives you confidence, especially when it balances function, budget and long-term value. You appreciate clear communication and decisions grounded in purpose rather than guesswork.',
  },
  {
    archetype: 'decisive_delegator',
    name: 'The Visionary',
    headline: 'You see the potential in a space before anyone else does.',
    description:
      "You're drawn to the big picture and the feeling a space could create. You trust experienced guidance, welcome bold ideas and focus on what the finished result can become. You don't need to manage every detail to stay connected to a vision that feels right.",
  },
]

const archetypes = loadArchetypes()
const raw = designDnaJson as unknown as { profiles: Record<string, unknown>[] } & Record<string, unknown>
const withProfiles = (profiles: unknown[]) => ({ ...raw, profiles })

describe('design-dna.json (the real file)', () => {
  test('loads, with the labels from the mockup', () => {
    const data = loadDesignDna()
    expect(data.label).toBe('DESIGN DNA')
    expect(data).not.toHaveProperty('secondaryLabel')
  })

  test('has the team profiles, paired with their client types, word for word', () => {
    expect(loadDesignDna().profiles).toEqual(TEAM_PROFILES)
  })

  test('is part of the quiz data', () => {
    expect(loadQuizData().designDna).toEqual(loadDesignDna())
  })
})

describe('parseDesignDna', () => {
  test('throws when a client type has no profile', () => {
    expect(() => parseDesignDna(withProfiles(raw.profiles.slice(1)), archetypes)).toThrow(/hands_on_controller has no design DNA profile/)
  })

  test('throws when a client type has two profiles', () => {
    const twice = [...raw.profiles, { ...raw.profiles[0], name: 'The Other One' }]
    expect(() => parseDesignDna(withProfiles(twice), archetypes)).toThrow(/hands_on_controller.*more than one/)
  })

  test('throws on an unknown client type', () => {
    const unknown = [...raw.profiles.slice(1), { ...raw.profiles[0], archetype: 'mystery_type' }]
    expect(() => parseDesignDna(withProfiles(unknown), archetypes)).toThrow(/unknown client type.*mystery_type/)
  })

  test('throws when two profiles share a name', () => {
    const same = raw.profiles.map((p) => ({ ...p, name: 'The Curator' }))
    expect(() => parseDesignDna(withProfiles(same), archetypes)).toThrow(/name.*The Curator.*more than once/)
  })

  test('throws on blank text', () => {
    const blank = raw.profiles.map((p, i) => (i === 2 ? { ...p, headline: '' } : p))
    expect(() => parseDesignDna(withProfiles(blank), archetypes)).toThrow(/profile 2.*headline/)
    expect(() => parseDesignDna({ ...raw, label: '' }, archetypes)).toThrow(/"label"/)
  })

  test('throws on a curly apostrophe or other special character', () => {
    const curly = raw.profiles.map((p, i) => (i === 1 ? { ...p, headline: 'You’d rather discover' } : p))
    expect(() => parseDesignDna(withProfiles(curly), archetypes)).toThrow(/profile 1.*headline.*plain characters/)
  })
})
