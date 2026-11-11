import type { ArchetypeScore } from './types'

// "The Decisive Delegator" -> "Decisive Delegator".
function name(score: ArchetypeScore): string {
  return score.label.replace(/^The /, '')
}

// "A", "A and B", "A, B and C".
function joinNames(scores: ArchetypeScore[]): string {
  const names = scores.map(name)
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

// Notes for the team brief when the quiz could not really tell client types
// apart (DECISIONS.md 2026-11-11). `scores` is highest first, `shownIds` are the
// types in the headline, and `points` is closeCallPoints: types this many
// percentage points apart or closer count as level. Returns no note, one or two.
export function findCloseCalls(scores: ArchetypeScore[], shownIds: string[], points: number): string[] {
  // Types with no points are never named; with none at all there is nothing to say.
  const scored = scores.filter((s) => s.percent > 0)
  if (scored.length === 0) return []
  const notes: string[] = []

  // 1. The main type is unclear: other types are level with the top one.
  const top = scored[0]
  const level = scored.filter((s) => top.percent - s.percent <= points)
  if (level.length >= 2) {
    const how = points === 0 ? 'scored the same' : `are within ${points} points of each other`
    notes.push(`Close call: ${joinNames(level)} ${how}. Treat the client type as unclear and ask on the call.`)
  }

  // 2. A type left out of a full headline is level with the last type shown,
  // so it was dropped only by list order. Types named above are not repeated.
  if (shownIds.length >= 2) {
    const lastShown = scored.find((s) => s.id === shownIds.at(-1))
    const leftOut = lastShown
      ? scored.filter((s) => !shownIds.includes(s.id) && !level.includes(s) && lastShown.percent - s.percent <= points)
      : []
    if (leftOut.length > 0 && lastShown) {
      const how = points === 0 ? 'scored the same as' : `scored within ${points} points of`
      const verb = leftOut.length === 1 ? 'is' : 'are'
      notes.push(`Close call: ${joinNames(leftOut)} ${how} ${name(lastShown)} but ${verb} not in the headline.`)
    }
  }
  return notes
}
