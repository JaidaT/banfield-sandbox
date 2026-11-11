import AnswersSummary from '@/components/form/AnswersSummary'
import CopyBriefButton from '@/components/form/CopyBriefButton'
import { outputToText } from '@/lib/questionnaire/outputToText'
import type { QuestionnaireOutput } from '@/lib/form/output'

// What the team sees: skipped steps, every answer, and "Copy as text" for
// pasting into Claude or JobTread.
export default function QuestionnaireTeamView({ output }: { output: QuestionnaireOutput }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        Steps skipped: {output.skippedSteps.length === 0 ? 'none' : output.skippedSteps.join(', ')}
      </p>
      <div>
        <CopyBriefButton text={outputToText(output)} />
      </div>
      <AnswersSummary output={output} />
    </div>
  )
}
