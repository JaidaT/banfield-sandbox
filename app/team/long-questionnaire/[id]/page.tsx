import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import QuestionnaireTeamView from "@/components/long-questionnaire/QuestionnaireTeamView";
import { HEADING, HINT } from "@/components/form/styles";
import WireframePage from "@/components/form/WireframePage";
import { loadQuestionnaire, loadSampleHouseholds } from "@/lib/long-questionnaire/load";
import { buildOutput, contactName } from "@/lib/form/output";

type Params = PageProps<"/team/long-questionnaire/[id]">["params"];

export function generateStaticParams() {
  return loadSampleHouseholds().map((s) => ({ id: s.id }));
}

// The team view of one made-up household's questionnaire answers. Plain
// wireframe styling, like the questionnaire itself. Reading which household
// (the address) happens inside Suspense, so a click from the list shows the
// page straight away (Next.js instant navigation guide).
export default function HouseholdPage({ params }: PageProps<"/team/long-questionnaire/[id]">) {
  return (
    <Suspense fallback={<p className="px-4 py-8">Loading...</p>}>
      <HouseholdContent params={params} />
    </Suspense>
  );
}

export async function HouseholdContent({ params }: { params: Params }) {
  const { id } = await params;
  const sample = loadSampleHouseholds().find((s) => s.id === id);
  if (!sample) notFound();
  const output = buildOutput(loadQuestionnaire(), sample.answers);
  const name = contactName(output) ?? sample.label;

  return (
    <WireframePage banner="Team only - sample household - not the final design">
      <Link href="/team/long-questionnaire" className="text-sm underline">
        Back to long questionnaire samples
      </Link>
      <h1 className={HEADING}>Get to know you: {name}</h1>
      <p className={HINT}>
        {sample.label}. Test note (prototype only): {sample.note}
      </p>
      <QuestionnaireTeamView output={output} />
    </WireframePage>
  );
}
