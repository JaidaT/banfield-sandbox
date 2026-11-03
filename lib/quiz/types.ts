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

export const QUESTION_KINDS = ['single', 'multi', 'text', 'range'] as const
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
  // Left out of the skipped count when unanswered (e.g. "Anything else we missed?").
  ignoreIfSkipped?: boolean
  maxSelections?: number
  // Range (slider) questions only. The answer is a number from min to max in
  // steps of `step`, or the id of one of `options` (e.g. "Not sure yet").
  min?: number
  max?: number
  step?: number
  // Marks a fit question (project, investment, timing and so on). Fit questions
  // never carry archetype weights; how they count lives in fit.json.
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

export const LEAD_TEMPERATURES = ['hot', 'warm', 'cold'] as const
export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number]

// Investment amounts for one project type: at or above `hotFrom` is hot, at or
// above `warmFrom` is warm, anything lower is cold.
export interface ProjectThresholds {
  hotFrom: number
  warmFrom: number
}

// A project answer shown in the brief for context. It never changes the label.
export interface LeadDetailRule {
  id: string
  label: string
  questionId: string
}

export interface LeadRules {
  // The project type question (single choice) and the investment question (range).
  projectQuestion: string
  investmentQuestion: string
  // Keyed by project type option id.
  thresholds: Record<string, ProjectThresholds>
  // Starting label when the project type or investment is unanswered or "Not sure".
  unsureStart: LeadTemperature
  details: LeadDetailRule[]
  // Any raised flag lowers the label by one step (never more than one).
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
// Range: a number, or an option id such as "not_sure".
// A question with no entry was skipped.
export type Answer = string | string[] | number

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

export interface LeadDetail {
  id: string
  label: string
  // Readable answer (e.g. "A renovation", "$200K"). Absent when unanswered.
  answer?: string
}

// Team-facing only. Never shown to the client.
export interface LeadAssessment {
  temperature: LeadTemperature
  // Before any warning sign lowered it.
  startingTemperature: LeadTemperature
  lowered: boolean
  // Plain-language explanation, e.g. "Renovation at $200K: hot".
  reasons: string[]
  details: LeadDetail[]
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
  fitRules: LeadRules
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
  fit: LeadAssessment
  behaviour: {
    durationSeconds: number
    skippedQuestions: string[]
    avgTextLength: number | null
    notes: string[]
  }
  answers: AnswerLine[]
}
