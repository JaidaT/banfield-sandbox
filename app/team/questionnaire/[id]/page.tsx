import Link from "next/link";
import { notFound } from "next/navigation";
import QuestionnaireTeamView from "@/components/questionnaire/QuestionnaireTeamView";
import { HEADING, HINT } from "@/components/questionnaire/styles";
import WireframePage from "@/components/questionnaire/WireframePage";
import { loadQuestionnaire, loadSampleHouseholds } from "@/lib/questionnaire/load";
import { buildOutput } from "@/lib/questionnaire/output";

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
  const name = output.steps.flatMap((s) => s.answers).find((a) => a.id === "name")?.value ?? sample.label;

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
