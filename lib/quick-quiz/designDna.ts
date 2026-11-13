import { HIGHLIGHT_MIN_PERCENT } from './highlights'
import { scoreArchetypes } from './scoreArchetypes'
import type { ArchetypeBlend, ClientDesignDna, DesignDnaData, QuizData, Submission } from './types'

// Scores a submission and picks its Design DNA. Used by the quiz screen, the
// sample result pages and the team brief, so they always agree.
export function designDnaFor(submission: Submission, data: QuizData): ClientDesignDna | null {
  const blend = scoreArchetypes(submission, data.questions, data.archetypes, data.signalRules)
  return pickDesignDna(blend, data.designDna)
}

// The Design DNA for a scored quiz: the top client type's profile, plus the
// second type's profile name as a secondary trait when it scores 20% or more
// (the same rule as the brief's highlights). Ties follow the score order,
// which keeps archetypes.json order. Null when there are not enough answers.
export function pickDesignDna(blend: ArchetypeBlend, data: DesignDnaData): ClientDesignDna | null {
  if (blend.insufficient || blend.scores.length === 0) return null
  const profileFor = (id: string) => data.profiles.find((p) => p.archetype === id)
  const main = profileFor(blend.scores[0].id)
  if (!main) return null

  const second = blend.scores[1]
  const secondProfile = second && second.percent >= HIGHLIGHT_MIN_PERCENT ? profileFor(second.id) : undefined

  // Only the words are copied over, never the client type id.
  return {
    label: data.label,
    name: main.name,
    headline: main.headline,
    description: main.description,
    secondary: secondProfile ? { label: data.secondaryLabel, name: secondProfile.name } : null,
  }
}
