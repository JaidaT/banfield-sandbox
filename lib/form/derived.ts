import type { Answers, DerivedValues } from './types'

// The household repeater and its age field in questionnaire.json. If either id
// changes in the data file, change it here too.
const HOUSEHOLD_REPEATER = 'people'
const AGE_FIELD = 'age'
const ADULT_AGE = 18

// Values worked out from the answers, usable in rules like a question id.
// Both are null until at least one age is entered, so "under 18" and
// "2 or more adults" rules do not match an empty household.
export function deriveValues(answers: Answers): DerivedValues {
  const cards = answers[HOUSEHOLD_REPEATER]
  const ages = Array.isArray(cards)
    ? cards.flatMap((card) => {
        const age = typeof card === 'object' ? card[AGE_FIELD] : undefined
        return typeof age === 'number' ? [age] : []
      })
    : []

  if (ages.length === 0) return { household_min_age: null, adult_count: null }
  return {
    household_min_age: Math.min(...ages),
    adult_count: ages.filter((age) => age >= ADULT_AGE).length,
  }
}
