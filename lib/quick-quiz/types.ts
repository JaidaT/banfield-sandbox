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
  // never carry archetype weights; how they count lives in lead-rules.json.
  fitQuestion?: boolean
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

export interface WarningCondition {
  question: string
  option: string
}

// Raised when every condition in `when` matches the submission's answers.
export interface WarningSign {
  id: string
  note: string
  when: WarningCondition[]
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
  // Any raised sign lowers the label by one step (never more than one).
  warningSigns: WarningSign[]
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
  // Made-up date it was sent, YYYY-MM-DD, for the team's sample list.
  submittedAt: string
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
  warningSigns: WarningSign[]
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
  leadRules: LeadRules
  // Client types this many percentage points apart or closer get a "Close
  // call" note in the brief (closeCallPoints in archetypes.json).
  closeCallPoints: number
  designDna: DesignDnaData
}

// One Design DNA profile (data/quick-quiz/design-dna.json). `archetype` is the
// client type it belongs to: team-only, never shown to the client.
export interface DesignDnaProfile {
  archetype: string
  name: string
  headline: string
  description: string
}

// The Design DNA a client sees: profile words and labels only. Deliberately has
// no client type id, label or score, so it cannot leak them.
export interface ClientDesignDna {
  label: string
  name: string
  headline: string
  description: string
  secondary: { label: string; name: string } | null
}

export interface DesignDnaData {
  label: string
  secondaryLabel: string
  profiles: DesignDnaProfile[]
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

// Result screen wording (data/quick-quiz/client-result.json), from the team's mockup.
export interface ClientCopy {
  completeLabel: string
  heading: string
  intro: string
  next: { title: string; text: string }
  cta: { label: string; bookingUrl: string }
  thanks: { title: string; text: string }
}

// Quiz screen wording that is not in the question bank (data/quick-quiz/quiz-form.json).
export interface QuizForm {
  // false: the contact fields can be left blank and the result still shows.
  // true: name, email, phone and the full site address are required first.
  contactRequired: boolean
  welcome: { title: string; intro: string }
  // Prompts for the contact screen, which comes last.
  contact: {
    title: string
    introWhenRequired: string
    introWhenOptional: string
    name: string
    email: string
    phone: string
    street: string
    city: string
    postalCode: string
  }
}

// Client-facing. Deliberately has no archetype, blend or fit fields: the
// Design DNA is profile words only (ClientDesignDna).
export interface ClientResult {
  completeLabel: string
  heading: string
  intro: string
  // null when there were not enough answers to pick a profile.
  designDna: ClientDesignDna | null
  next: { title: string; text: string }
  cta: { label: string; href: string }
  thanks: { title: string; text: string }
}

// Team-facing only. Never render any part of this to the client.
export interface TeamBrief {
  submissionId: string
  headline: string
  // "Close call: ..." sentences when the quiz could not really tell client
  // types apart (findCloseCalls). Empty when the type is clear.
  closeCalls: string[]
  contact: Contact
  blend: ArchetypeBlend
  highlights: ArchetypeGuidance[]
  lead: LeadAssessment
  behaviour: {
    durationSeconds: number
    skippedQuestions: string[]
    avgTextLength: number | null
    notes: string[]
  }
  answers: AnswerLine[]
}
