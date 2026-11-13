import { scoreArchetypes } from './scoreArchetypes'
import type { ArchetypeBlend, ClientDesignDna, DesignDnaData, QuizData, Submission } from './types'

// Scores a submission and picks its Design DNA. Used by the quiz screen, the
// sample result pages and the team brief, so they always agree.
export function designDnaFor(submission: Submission, data: QuizData): ClientDesignDna | null {
  const blend = scoreArchetypes(submission, data.questions, data.archetypes, data.signalRules)
  return pickDesignDna(blend, data.designDna)
}

// The Design DNA for a scored quiz: the top client type's profile. Ties follow
// the score order, which keeps archetypes.json order. Null when there are not
// enough answers. No secondary trait: the team decided it was too much
// (DECISIONS.md 2026-11-13).
export function pickDesignDna(blend: ArchetypeBlend, data: DesignDnaData): ClientDesignDna | null {
  if (blend.insufficient || blend.scores.length === 0) return null
  const main = data.profiles.find((p) => p.archetype === blend.scores[0].id)
  if (!main) return null

  // Only the words are copied over, never the client type id.
  return {
    label: data.label,
    name: main.name,
    headline: main.headline,
    description: main.description,
  }
}
