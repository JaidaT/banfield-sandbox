import type { Answers } from './types'

// A made-up household from data/questionnaire/sample-answers.json, used for
// tests and the team pages. expectedSteps lists the step ids it should see.
export interface SampleHousehold {
  id: string
  label: string
  note: string
  expectedSteps: string[]
  answers: Answers
}
