import Link from "next/link";
import { notFound } from "next/navigation";
import QuestionnaireTeamView from "@/components/questionnaire/QuestionnaireTeamView";
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
    <div className="flex-1 bg-white font-[system-ui] text-neutral-900">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6">
        <p className="rounded border border-dashed border-neutral-500 bg-neutral-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-widest text-neutral-600">
          Team only - sample household - not the final design
        </p>
        <Link href="/team" className="text-sm underline">
          Back to all samples
        </Link>
        <h1 className="text-2xl font-bold">Get to know you: {name}</h1>
        <p className="text-sm text-neutral-600">
          {sample.label}. Intended: {sample.note}
        </p>
        <QuestionnaireTeamView output={output} />
      </main>
    </div>
  );
}
