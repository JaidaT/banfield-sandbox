import QuestionnaireTeamView from "./QuestionnaireTeamView";
import type { DoneScreenProps } from "@/components/form/QuestionnaireForm";
import { HEADING } from "@/components/form/styles";
import { buildOutput } from "@/lib/form/output";

// The long questionnaire's thank-you after Submit. Below a divider, the
// prototype also shows what the team would receive (in the real product this
// would be sent, not shown).
export default function DoneScreen({ questionnaire, answers, headingRef }: DoneScreenProps) {
  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} className={HEADING}>
        Thank you!
      </h2>
      {/* <p>We will read through everything before we meet. Talk soon.</p> */}
      <p>Thank you for sharing a little about yourself and your home!</p>
      <p>
        Your answers will help us get to know you, understand what&apos;s important,
        and make something that truly works for you. You don&apos;t need to have
        every detail figured out, we&apos;ll work through the possibilities together.
      </p>
      <p>We look forward to learning more about your vision!</p>
      <div className="mt-6 border-t-4 border-double border-neutral-400 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-600">
          Team view (demo only)
        </p>
        <QuestionnaireTeamView output={buildOutput(questionnaire, answers)} />
      </div>
    </>
  );
}
