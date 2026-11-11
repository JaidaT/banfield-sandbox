import Link from "next/link";
import { LEAD_STYLES } from "@/components/quick-quiz/TeamBriefView";
import { quickQuizRows } from "@/lib/quick-quiz/sampleList";

// The team's list of Quick Quiz results, shaped like the real list of
// completed submissions will be. For now it shows the made-up samples.
export default function QuickQuizList() {
  const rows = quickQuizRows();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <Link href="/" className="self-start text-sm font-semibold text-navy underline">
          Back to the prototype home
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
          Team only - sample submissions
        </p>
        <h1 className="font-heading text-3xl font-bold text-navy">Quick Quiz results</h1>
        <p className="text-sm leading-6">
          Made-up people, newest first, each written to represent a type of client. Open a brief to
          see what Jamie would read before the call.
        </p>
        <Link href="/quiz" className="self-start text-sm font-semibold text-navy underline">
          Try the Quick Quiz
        </Link>
      </header>

      <ol aria-label="Quick Quiz results" className="flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 rounded-xl bg-white/70 p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-heading text-lg font-bold text-navy">{row.name}</h2>
              <p className="text-sm text-charcoal/70">{row.date}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-full px-3 py-0.5 font-semibold ${LEAD_STYLES[row.temperature]}`}>
                {row.temperature[0].toUpperCase() + row.temperature.slice(1)} lead
              </span>
              <span>{row.typeLine}</span>
              {row.closeCall && (
                <span className="rounded-full border-2 border-navy px-3 py-0.5 text-xs font-semibold">Close call</span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm font-semibold">
              <Link href={`/team/quick-quiz/${row.id}`} aria-label={`Brief: ${row.name}`} className="text-navy underline">
                Brief
              </Link>
              <Link href={`/result/${row.id}`} aria-label={`Client result: ${row.name}`} className="text-navy underline">
                Client result
              </Link>
            </div>
            <p className="text-xs text-charcoal/60">Test note (prototype only): {row.note}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
