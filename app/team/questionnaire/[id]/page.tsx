import Link from "next/link";
import { notFound } from "next/navigation";
import QuestionnaireTeamView from "@/components/long-questionnaire/QuestionnaireTeamView";
import { HEADING, HINT } from "@/components/form/styles";
import WireframePage from "@/components/form/WireframePage";
import { loadQuestionnaire, loadSampleHouseholds } from "@/lib/long-questionnaire/load";
import { buildOutput, contactName } from "@/lib/form/output";

export function generateStaticParams() {
  return loadSampleHouseholds().map((s) => ({ id: s.id }));
}

// The team view of one made-up household's questionnaire answers. Plain
// wireframe styling, like the questionnaire itself.
export default async function HouseholdPage({ params }: PageProps<"/team/questionnaire/[id]">) {
  const { id } = await params;
  const sample = loadSampleHouseholds().find((s) => s.id === id);
  if (!sample) notFound();
  const output = buildOutput(loadQuestionnaire(), sample.answers);
  const name = contactName(output) ?? sample.label;

  return (
    <WireframePage banner="Team only - sample household - not the final design">
      <Link href="/team" className="text-sm underline">
        Back to all samples
      </Link>
      <h1 className={HEADING}>Get to know you: {name}</h1>
      <p className={HINT}>
        {sample.label}. Intended: {sample.note}
      </p>
      <QuestionnaireTeamView output={output} />
    </WireframePage>
  );
}
