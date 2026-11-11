import Link from "next/link";
import { longQuestionnaireRows } from "@/lib/long-questionnaire/sampleList";

// The team's list of long questionnaire results, shaped like the real list of
// completed submissions will be. For now it shows the made-up households.
export default function LongQuestionnaireList() {
  const rows = longQuestionnaireRows();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <Link href="/" className="self-start text-sm font-semibold text-navy underline">
          Back to the prototype home
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
          Team only - sample submissions
        </p>
        <h1 className="font-heading text-3xl font-bold text-navy">Long questionnaire results</h1>
        <p className="text-sm leading-6">
          Made-up households, newest first. Open one to see everything the team would receive.
        </p>
        <Link href="/questionnaire" className="self-start text-sm font-semibold text-navy underline">
          Try the Long Questionnaire
        </Link>
      </header>

      <ol aria-label="Long questionnaire results" className="flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 rounded-xl bg-white/70 p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-heading text-lg font-bold text-navy">{row.name}</h2>
              <p className="text-sm text-charcoal/70">{row.date}</p>
            </div>
            <p className="text-sm text-charcoal/70">{row.label}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full border-2 border-navy px-3 py-0.5 font-semibold">{row.projectType}</span>
              <span>Steps skipped: {row.stepsSkipped}</span>
            </div>
            <Link
              href={`/team/long-questionnaire/${row.id}`}
              aria-label={`Full result: ${row.name}`}
              className="self-start text-sm font-semibold text-navy underline"
            >
              Full result
            </Link>
            <p className="text-xs text-charcoal/60">Test note (prototype only): {row.note}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
