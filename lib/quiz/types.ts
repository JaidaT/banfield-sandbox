export type ArchetypeId = string
export type SegmentId = string

export interface Archetype {
  id: ArchetypeId
  label: string
  tagline: string
  description: string
  segments: SegmentId[]
  signals: string[]
  communication: string
  pacing: string
  pitch: string
  risks: string[]
  brief_tips: string
}

export interface ArchetypeData {
  archetypes: Archetype[]
  segments: Record<SegmentId, string>
}

export type Weights = Partial<Record<ArchetypeId, number>>

export const QUESTION_KINDS = ['single', 'multi', 'text'] as const
export type QuestionKind = (typeof QUESTION_KINDS)[number]

export interface AnswerOption {
  id: string
  label: string
  weights: Weights
}

export interface Question {
  id: string
  kind: QuestionKind
  prompt: string
  help?: string
  optional: boolean
  maxSelections?: number
  // Fit questions name the criterion they feed; their ratings live in fit.json.
  criterion?: string
  options: AnswerOption[]
}

// Behavioural signals measured while the quiz is taken, not answered directly.
export const SIGNALS = ['durationSeconds', 'skippedCount', 'avgTextLength'] as const
export type Signal = (typeof SIGNALS)[number]

export const COMPARISONS = ['lt', 'lte', 'gt', 'gte'] as const
export type Comparison = (typeof COMPARISONS)[number]

export interface SignalRule {
  id: string
  signal: Signal
  op: Comparison
  value: number
  weights: Weights
  note: string
}

export const FIT_RATINGS = ['strong', 'possible', 'weak'] as const
export type FitRating = (typeof FIT_RATINGS)[number]

export interface FitCriterion {
  id: string
  label: string
  // The question whose `criterion` matches this id.
  questionId: string
  // Keyed by answer option id.
  ratings: Record<string, FitRating>
}

export interface FitCondition {
  question: string
  option: string
}

// Raised when every condition in `when` matches the submission's answers.
export interface RedFlag {
  id: string
  note: string
  when: FitCondition[]
}

export interface FitRules {
  criteria: Record<string, FitCriterion>
  serviceAreas: string[]
  redFlags: RedFlag[]
}
