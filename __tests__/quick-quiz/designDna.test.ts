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

// "How we can help": Claude's draft, approved by Jaida on 2026-11-15.
const APPROVED_HELP: Record<string, { title: string; text: string }[]> = {
  'The Curator': [
    { title: 'You stay in the loop.', text: 'Regular updates on your project budget, timeline and open decisions, so you always know where things stand.' },
    { title: 'Clear places to weigh in.', text: 'We agree up front on the decisions you want to make yourself, and plan check-ins around them.' },
    { title: 'The reasons behind each choice.', text: 'We explain why we recommend a material, layout or trade, so your ideas and ours work together.' },
  ],
  'The Explorer': [
    { title: 'See it before you commit.', text: 'Mood boards and renderings help you picture ideas in your space before anything is decided.' },
    { title: 'Design sessions together.', text: 'We build working sessions into the key moments, so your ideas shape the design as it grows.' },
    { title: 'Room to explore, with a clear frame.', text: 'We set the scope and budget early, so new ideas can be explored without losing track of the plan.' },
  ],
  'The Nest Builder': [
    { title: 'A guided, step-by-step process.', text: 'We walk you through each stage and always tell you what comes next.' },
    { title: 'Clear costs, explained early.', text: 'We talk through costs openly from the start, so you know what to expect at each stage.' },
    { title: 'Decisions at a comfortable pace.', text: 'We bring a few well-chosen options at a time, and make room for the people whose opinions matter to you.' },
  ],
  'The Strategist': [
    { title: 'Options side by side.', text: 'We lay out the choices with the costs, trade-offs and reasoning behind each one.' },
    { title: 'Time to review.', text: 'We send materials before each meeting, so you can come ready with questions.' },
    { title: 'A plan with clear decision points.', text: "Each step is documented, so you can see how today's choices support long-term value, comfort and energy performance." },
  ],
  'The Visionary': [
    { title: 'We take the lead.', text: 'Our team manages the process from first sketch to finished space, so you can focus on the result.' },
    { title: 'Two strong options, not ten.', text: 'We bring focused recommendations, so decisions feel quick and confident.' },
    { title: 'Your time, respected.', text: 'Fewer, well-planned meetings and short updates, each with a clear next step.' },
  ],
}

const archetypes = loadArchetypes()
const raw = designDnaJson as unknown as { profiles: Record<string, unknown>[] } & Record<string, unknown>
const withProfiles = (profiles: unknown[]) => ({ ...raw, profiles })

describe('design-dna.json (the real file)', () => {
  test('loads, with the labels from the mockup', () => {
    const data = loadDesignDna()
    expect(data.label).toBe('DESIGN DNA')
    expect(data).not.toHaveProperty('secondaryLabel')
    expect(data.helpLabel).toBe('How we can help')
  })

  test('has the team profiles, paired with their client types, word for word', () => {
    const words = loadDesignDna().profiles.map(({ archetype, name, headline, description }) => ({ archetype, name, headline, description }))
    expect(words).toEqual(TEAM_PROFILES)
  })

  test('each profile has its approved "How we can help" points, word for word', () => {
    for (const profile of loadDesignDna().profiles) {
      expect(profile.help, profile.name).toEqual(APPROVED_HELP[profile.name])
    }
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

  describe('"How we can help" points', () => {
    const withHelp = (help: unknown) => withProfiles(raw.profiles.map((p, i) => (i === 3 ? { ...p, help } : p)))
    const point = { title: 'A title.', text: 'A sentence.' }

    test('throws when the help label is blank or missing', () => {
      expect(() => parseDesignDna({ ...raw, helpLabel: '' }, archetypes)).toThrow(/"helpLabel"/)
      const { helpLabel: _unused, ...noLabel } = raw
      void _unused
      expect(() => parseDesignDna(noLabel, archetypes)).toThrow(/"helpLabel"/)
    })

    test('throws when a profile has no points, or more than 3', () => {
      expect(() => parseDesignDna(withHelp(undefined), archetypes)).toThrow(/profile 3.*2 to 3 "help" points/)
      expect(() => parseDesignDna(withHelp([point]), archetypes)).toThrow(/profile 3.*2 to 3 "help" points/)
      expect(() => parseDesignDna(withHelp([point, point, point, point]), archetypes)).toThrow(/profile 3.*2 to 3 "help" points/)
    })

    test('accepts 2 points', () => {
      expect(parseDesignDna(withHelp([point, point]), archetypes).profiles[3].help).toHaveLength(2)
    })

    test('throws on a blank title or text', () => {
      expect(() => parseDesignDna(withHelp([point, { ...point, title: '' }]), archetypes)).toThrow(/profile 3 help 1 "title"/)
      expect(() => parseDesignDna(withHelp([{ ...point, text: '' }, point]), archetypes)).toThrow(/profile 3 help 0 "text"/)
    })

    test('throws on a curly apostrophe', () => {
      expect(() => parseDesignDna(withHelp([point, { ...point, text: 'We’ll help.' }]), archetypes)).toThrow(
        /profile 3 help 1 "text".*plain characters/,
      )
    })
  })
})
