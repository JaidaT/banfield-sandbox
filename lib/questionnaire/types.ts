// Shapes for the long "Let us get to know you" questionnaire.
// Separate from lib/quiz on purpose (see DECISIONS.md): no scoring here.

export const QUESTION_KINDS = [
  'short_text',
  'long_text',
  'single',
  'multi',
  'number',
  'date',
  'repeater',
  'pick_images',
] as const
export type QuestionKind = (typeof QUESTION_KINDS)[number]

// Values worked out from the answers (see derived.ts), usable in conditions
// like a question id, e.g. { "field": "household_min_age", "lessThan": 18 }.
export const DERIVED_VALUES = ['household_min_age', 'adult_count'] as const
export type DerivedName = (typeof DERIVED_VALUES)[number]

// One check against an earlier answer or a derived value. Exactly one of
// equals, in, includes, lessThan or atLeast is used.
export type FieldCondition =
  | { field: string; equals: string | number }
  | { field: string; in: string[] }
  // For multi-choice answers: the person ticked this option.
  | { field: string; includes: string }
  // For numbers: below the value, or the value and above.
  | { field: string; lessThan: number }
  | { field: string; atLeast: number }

// At most one level of any/all, so rules stay readable.
export type Condition = FieldCondition | { any: FieldCondition[] } | { all: FieldCondition[] }

export interface AnswerOption {
  id: string
  label: string
  // Option filter: only offered when this matches (e.g. spaces by project type).
  showIf?: Condition
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
  // single and multi.
  options: AnswerOption[]
  // repeater: the questions on each "add another" card.
  fields?: Question[]
  addLabel?: string
  max?: number
  // pick_images: each set gets a favourite and a least favourite.
  imageSets?: ImageSet[]
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

// Text, choice and date answers are strings; number answers are numbers;
// multi-choice answers are lists of option ids. A missing key means unanswered.
export type AnswerValue = string | number | string[] | RepeaterEntry[] | ImagePicks
export type Answers = Record<string, AnswerValue>

// null when the household repeater has no ages yet, so age rules do not match.
export type DerivedValues = Record<DerivedName, number | null>
