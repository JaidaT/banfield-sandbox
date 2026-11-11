import type { Answers } from '@/lib/form/types'

// A made-up household from data/long-questionnaire/sample-answers.json, used for
// tests and the team pages. expectedSteps lists the step ids it should see.
export interface SampleHousehold {
  id: string
  label: string
  note: string
  // Made-up date it was sent, YYYY-MM-DD, for the team's sample list.
  submittedAt: string
  expectedSteps: string[]
  answers: Answers
}
