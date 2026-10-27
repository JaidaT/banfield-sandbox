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

export interface SiteAddress {
  street: string
  city: string
  postalCode: string
}

export interface Contact {
  name: string
  email: string
  phone: string
  siteAddress: SiteAddress
}

// Single-choice: option id. Multi-choice: option ids. Text: free text.
// A question with no entry was skipped.
export type Answer = string | string[]

export interface Submission {
  id: string
  contact: Contact
  answers: Record<string, Answer>
  durationSeconds: number
}

// A made-up submission used in tests and demo pages.
export interface SampleSubmission extends Submission {
  note: string
}

export interface SignalValues {
  durationSeconds: number
  skippedCount: number
  // Null when no open-text question was answered, so length rules do not apply.
  avgTextLength: number | null
}

export interface SignalResult {
  values: SignalValues
  matched: SignalRule[]
}

export interface ArchetypeScore {
  id: ArchetypeId
  label: string
  points: number
  percent: number
}

export interface CriterionResult {
  id: string
  label: string
  rating: FitRating | 'unanswered'
  // What the client chose (or their city, for location). Absent when unanswered.
  answer?: string
}

export interface FitAssessment {
  overall: FitRating
  criteria: CriterionResult[]
  redFlags: RedFlag[]
}

export interface ArchetypeBlend {
  // Highest first; ties keep the order archetypes appear in archetypes.json.
  scores: ArchetypeScore[]
  insufficient: boolean
}

export interface QuizData {
  archetypes: Archetype[]
  questions: Question[]
  signalRules: SignalRule[]
  fitRules: FitRules
}

// Team-facing guidance for one of the client's leading archetypes.
export interface ArchetypeGuidance {
  id: ArchetypeId
  label: string
  tagline: string
  percent: number
  communication: string
  pacing: string
  pitch: string
  risks: string[]
  tip: string
}

export interface AnswerLine {
  questionId: string
  prompt: string
  // Readable answer (option labels or text); null when skipped.
  answer: string | null
}

export interface ClientCopy {
  greeting: string
  intro: string
  projectTitle: string
  projectLines: { question: string; prefix: string }[]
  confidenceTitle: string
  confidenceQuestion: string
  homeTitle: string
  homeQuestion: string
  closing: string
  cta: { label: string; text: string; bookingUrl: string; fallback: string }
}

// Client-facing. Deliberately has no archetype, blend or fit fields.
export interface ClientResult {
  greeting: string
  intro: string
  sections: { title: string; lines: string[] }[]
  closing: string
  cta: { label: string; text: string; href: string; fallback: string }
}

// Team-facing only. Never render any part of this to the client.
export interface TeamBrief {
  submissionId: string
  headline: string
  contact: Contact
  blend: ArchetypeBlend
  highlights: ArchetypeGuidance[]
  fit: FitAssessment
  behaviour: {
    durationSeconds: number
    skippedQuestions: string[]
    avgTextLength: number | null
    notes: string[]
  }
  answers: AnswerLine[]
}
