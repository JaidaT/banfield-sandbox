import { formatDate } from '@/lib/form/format'
import { buildOutput, contactName } from '@/lib/form/output'
import type { Questionnaire } from '@/lib/form/types'
import { loadQuestionnaire, loadSampleHouseholds } from './load'
import type { SampleHousehold } from './sampleTypes'

// The project type question in questionnaire.json. If its id changes there,
// change it here too (the sample list tests will fail until you do).
const PROJECT_QUESTION = 'project_type'

// One row in the team's list of long questionnaire results: what a reviewer
// scans for before opening one. Shaped like the real submissions list will be.
export interface LongQuestionnaireRow {
  id: string
  // The contact name they gave, or the sample's label if they skipped it.
  name: string
  // The sample's short description, e.g. "Furniture and styling couple".
  label: string
  // "Nov 8, 2026"
  date: string
  // In words, e.g. "Renovation", or "Not given".
  projectType: string
  // e.g. "Kids, Pets", or "none".
  stepsSkipped: string
  // The sample's testing note (prototype only).
  note: string
}

// The sample households as list rows, newest first.
export function longQuestionnaireRows(
  households: SampleHousehold[] = loadSampleHouseholds(),
  questionnaire: Questionnaire = loadQuestionnaire(),
): LongQuestionnaireRow[] {
  return [...households]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .map((household) => {
      const output = buildOutput(questionnaire, household.answers)
      const project = output.steps.flatMap((s) => s.answers).find((a) => a.id === PROJECT_QUESTION)
      return {
        id: household.id,
        name: contactName(output) ?? household.label,
        label: household.label,
        date: formatDate(household.submittedAt),
        projectType: project?.status === 'answered' && project.value ? project.value : 'Not given',
        stepsSkipped: output.skippedSteps.length > 0 ? output.skippedSteps.join(', ') : 'none',
        note: household.note,
      }
    })
}
