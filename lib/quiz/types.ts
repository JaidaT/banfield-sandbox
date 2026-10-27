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
