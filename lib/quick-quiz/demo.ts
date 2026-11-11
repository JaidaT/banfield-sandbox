import { buildClientResult } from './buildClientResult'
import { buildTeamBrief } from './buildTeamBrief'
import { loadClientCopy, loadQuizData, loadSampleSubmissions } from './load'
import type { ClientResult, SampleSubmission, TeamBrief } from './types'

// Demo helpers for the pages: everything is computed from the sample
// submissions until real quiz submissions exist.

export function sampleIds(): { id: string }[] {
  return loadSampleSubmissions().map((s) => ({ id: s.id }))
}

export function findSample(id: string): SampleSubmission | undefined {
  return loadSampleSubmissions().find((s) => s.id === id)
}

export function sampleBrief(id: string): TeamBrief | undefined {
  const sample = findSample(id)
  return sample && buildTeamBrief(sample, loadQuizData())
}

export function sampleResult(id: string): ClientResult | undefined {
  const sample = findSample(id)
  return sample && buildClientResult(sample, loadQuizData().questions, loadClientCopy())
}
