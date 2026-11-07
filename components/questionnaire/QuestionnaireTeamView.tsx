import AnswersSummary from './AnswersSummary'
import CopyBriefButton from '@/components/CopyBriefButton'
import { formatDuration, outputToText } from '@/lib/questionnaire/outputToText'
import type { QuestionnaireOutput } from '@/lib/questionnaire/output'

// What the team sees: time taken, skipped steps, every answer, and
// "Copy as text" for pasting into Claude or JobTread.
export default function QuestionnaireTeamView({ output }: { output: QuestionnaireOutput }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-1 text-sm">
        <li>Time to complete: {output.totalSeconds === null ? 'not recorded' : formatDuration(output.totalSeconds)}</li>
        <li>Steps skipped: {output.skippedSteps.length === 0 ? 'none' : output.skippedSteps.join(', ')}</li>
      </ul>
      <div>
        <CopyBriefButton text={outputToText(output)} />
      </div>
      <AnswersSummary output={output} />
    </div>
  )
}
