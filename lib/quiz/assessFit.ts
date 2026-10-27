import type {
  CriterionResult,
  FitAssessment,
  FitCondition,
  FitRating,
  FitRules,
  Question,
  Submission,
} from './types'

// Draft rule for Banfield to review: two or more concerns (weak ratings plus
// raised red flags) make the overall fit weak.
const CONCERNS_FOR_WEAK = 2

function normalizeCity(city: string): string {
  return city.trim().toLowerCase()
}

function conditionMet(submission: Submission, condition: FitCondition): boolean {
  const answer = submission.answers[condition.question]
  return Array.isArray(answer) ? answer.includes(condition.option) : answer === condition.option
}

// Reads only fit questions, the site address and fit rules. It never looks at
// archetype weights, so fit stays independent of working style.
export function assessFit(
  submission: Submission,
  questions: Question[],
  rules: FitRules,
): FitAssessment {
  const byId = new Map(questions.map((q) => [q.id, q]))

  const criteria: CriterionResult[] = Object.values(rules.criteria).map((criterion) => {
    const answer = submission.answers[criterion.questionId]
    const option =
      typeof answer === 'string'
        ? byId.get(criterion.questionId)?.options.find((o) => o.id === answer)
        : undefined
    if (!option) return { id: criterion.id, label: criterion.label, rating: 'unanswered' }
    return {
      id: criterion.id,
      label: criterion.label,
      rating: criterion.ratings[option.id],
      answer: option.label,
    }
  })

  const city = submission.contact.siteAddress.city.trim()
  const inArea = rules.serviceAreas.some((area) => normalizeCity(area) === normalizeCity(city))
  // Outside the list is "possible", never "weak": Jamie decides on location.
  criteria.push({ id: 'location', label: 'Location', rating: inArea ? 'strong' : 'possible', answer: city })

  const redFlags = rules.redFlags.filter((flag) => flag.when.every((c) => conditionMet(submission, c)))

  const concerns = criteria.filter((c) => c.rating === 'weak').length + redFlags.length
  let overall: FitRating = 'strong'
  if (concerns >= CONCERNS_FOR_WEAK) overall = 'weak'
  else if (concerns > 0 || criteria.some((c) => c.rating !== 'strong')) overall = 'possible'

  return { overall, criteria, redFlags }
}
