// Shapes for the long "Let us get to know you" questionnaire.
// Separate from lib/quiz on purpose (see DECISIONS.md): no scoring here.

export const QUESTION_KINDS = [
  'short_text',
  'long_text',
  'single',
  'multi',
  'number',
  'repeater',
  'pick_images',
  'range',
] as const
export type QuestionKind = (typeof QUESTION_KINDS)[number]

// How a slider shows its number. "money": $200K, and $500K+ at the top.
export const RANGE_FORMATS = ['money'] as const
export type RangeFormat = (typeof RANGE_FORMATS)[number]

// Values worked out from the answers (see derived.ts), usable in conditions
// like a question id, e.g. { "field": "household_min_age", "lessThan": 18 }.
export const DERIVED_VALUES = ['household_min_age', 'adult_count'] as const
export type DerivedName = (typeof DERIVED_VALUES)[number]

// One check against an earlier answer or a derived value. Exactly one of
// equals, in, includes, excludes, lessThan or atLeast is used.
export type FieldCondition =
  | { field: string; equals: string | number }
  | { field: string; in: string[] }
  // For multi-choice answers: the person ticked this option.
  | { field: string; includes: string }
  // For multi-choice answers: this person did NOT tick this option (blank counts).
  | { field: string; excludes: string}
  // For numbers: below the value, or the value and above.
  | { field: string; lessThan: number }
  | { field: string; atLeast: number }

// A plain rule, or "any": matches when at least one of its rules matches.
// One level only, so rules stay readable.
export type Condition = FieldCondition | { any: FieldCondition[] }

export interface AnswerOption {
  id: string
  label: string
  // Optional picture shown with the label, a path under public/
  // (e.g. the style question). Leave it out for words-only choices.
  image?: string
  // No showIf here: rules go on steps and questions only (DECISIONS.md, 2026-11-06).
}

export interface ImageChoice {
  id: string
  label: string
  // Path under public/, e.g. "/questionnaire/set1-a.svg".
  src: string
}

export interface ImageSet {
  id: string
  images: ImageChoice[]
}

export interface Question {
  id: string
  kind: QuestionKind
  prompt: string
  help?: string
  // Only contact and project type are required (QUESTIONNAIRE_DISCOVERY P3).
  required: boolean
  // Field rule: shown inline on its step only when this matches.
  showIf?: Condition
  // single and multi. range: optional extra choices such as "Not sure yet".
  options: AnswerOption[]
  // repeater: the questions on each "add another" card.
  fields?: Question[]
  addLabel?: string
  // repeater: the most cards allowed. range: the top of the slider.
  max?: number
  // pick_images: each set gets a favourite and a least favourite.
  imageSets?: ImageSet[]
  // range (a slider): the answer is a number from min to max in steps of
  // `step`, or the id of one of `options`.
  min?: number
  step?: number
  format?: RangeFormat
}

export interface Step {
  id: string
  title: string
  intro?: string
  // Step rule: the whole step is skipped unless this matches.
  showIf?: Condition
  questions: Question[]
}

export interface Questionnaire {
  steps: Step[]
}

// One card in a repeater, keyed by the card's field ids.
export type RepeaterEntry = Record<string, string | number | string[]>

// pick_images answers, keyed by image set id.
export type ImagePicks = Record<string, { favourite?: string; least?: string }>

// Text and choice answers are strings; number answers are numbers;
// multi-choice answers are lists of option ids; slider answers are a number or
// the id of one of its choices. A missing key means unanswered.
export type AnswerValue = string | number | string[] | RepeaterEntry[] | ImagePicks
export type Answers = Record<string, AnswerValue>

// A made-up household from data/questionnaire/sample-answers.json, used for
// tests and the team pages. expectedSteps lists the step ids it should see.
export interface SampleHousehold {
  id: string
  label: string
  note: string
  expectedSteps: string[]
  answers: Answers
}

// null when the household repeater has no ages yet, so age rules do not match.
export type DerivedValues = Record<DerivedName, number | null>
