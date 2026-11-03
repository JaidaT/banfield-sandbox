import { answerLabels, formatAmount } from './answers'
import type {
  FitCondition,
  LeadAssessment,
  LeadRules,
  LeadTemperature,
  Question,
  Submission,
} from './types'

// Order used when a warning sign lowers the label by one step.
const ONE_STEP_DOWN: Record<LeadTemperature, LeadTemperature> = {
  hot: 'warm',
  warm: 'cold',
  cold: 'cold',
}

function conditionMet(submission: Submission, condition: FitCondition): boolean {
  const answer = submission.answers[condition.question]
  return Array.isArray(answer) ? answer.includes(condition.option) : answer === condition.option
}

// Works out the starting label from project type + investment (see fit.json),
// with a plain-language reason for the brief.
function startingLabel(
  submission: Submission,
  rules: LeadRules,
  byId: Map<string, Question>,
): { temperature: LeadTemperature; reason: string } {
  const unsure = (why: string) => ({ temperature: rules.unsureStart, reason: `${why}: starts ${rules.unsureStart}` })

  const project = submission.answers[rules.projectQuestion]
  const thresholds = typeof project === 'string' ? rules.thresholds[project] : undefined
  if (!thresholds) return unsure('Project type not answered')

  const amount = submission.answers[rules.investmentQuestion]
  if (typeof amount !== 'number') {
    const investment = byId.get(rules.investmentQuestion)
    const label = investment ? answerLabels(investment, amount)[0] : undefined
    return unsure(label ? `Investment "${label}"` : 'Investment not answered')
  }

  const temperature: LeadTemperature =
    amount >= thresholds.hotFrom ? 'hot' : amount >= thresholds.warmFrom ? 'warm' : 'cold'
  const projectQuestion = byId.get(rules.projectQuestion)
  const projectLabel = projectQuestion ? answerLabels(projectQuestion, project)[0] : project
  const investmentMax = byId.get(rules.investmentQuestion)?.max
  return { temperature, reason: `${projectLabel} at ${formatAmount(amount, investmentMax)}: ${temperature}` }
}

// Reads only fit questions and fit rules. It never looks at the site address or
// archetype weights, so location and working style never change the label.
export function assessFit(
  submission: Submission,
  questions: Question[],
  rules: LeadRules,
): LeadAssessment {
  const byId = new Map(questions.map((q) => [q.id, q]))
  const start = startingLabel(submission, rules, byId)
  const redFlags = rules.redFlags.filter((flag) => flag.when.every((c) => conditionMet(submission, c)))

  // Any number of warning signs lowers the label one step, never more.
  const temperature = redFlags.length > 0 ? ONE_STEP_DOWN[start.temperature] : start.temperature
  const lowered = temperature !== start.temperature
  const reasons = [start.reason]
  if (lowered) reasons.push(`Lowered to ${temperature} by the warning signs below`)

  const details = rules.details.map((d) => {
    const question = byId.get(d.questionId)
    const labels = question ? answerLabels(question, submission.answers[d.questionId]) : []
    return labels.length > 0
      ? { id: d.id, label: d.label, answer: labels.join('; ') }
      : { id: d.id, label: d.label }
  })

  return { temperature, startingTemperature: start.temperature, lowered, reasons, details, redFlags }
}
