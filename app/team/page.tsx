import Link from "next/link";
import { buildTeamBrief } from "@/lib/quiz/buildTeamBrief";
import { loadSampleHouseholds } from "@/lib/questionnaire/load";
import { loadQuizData, loadSampleSubmissions } from "@/lib/quiz/load";

export default function TeamIndex() {
  const data = loadQuizData();
  const samples = loadSampleSubmissions();
  const households = loadSampleHouseholds();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
          Team only - sample submissions
        </p>
        <h1 className="font-heading text-3xl font-bold text-navy">Sample briefs</h1>
        <p className="text-sm leading-6">
          Made-up people, each written to represent a type of client. Compare the brief with the
          note to check the quiz reads them the way it should.
        </p>
        <Link href="/quiz" className="self-start text-sm font-semibold text-navy underline">
          Try the Quick Quiz
        </Link>
      </header>

      <ul className="flex flex-col gap-4">
        {samples.map((s) => (
          <li key={s.id} className="flex flex-col gap-2 rounded-xl bg-white/70 p-4 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-navy">{s.contact.name}</h2>
            <p className="text-sm font-medium">{buildTeamBrief(s, data).headline}</p>
            <p className="text-sm text-charcoal/70">Intended: {s.note}</p>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link href={`/team/brief/${s.id}`} className="text-navy underline">
                Team brief
              </Link>
              <Link href={`/result/${s.id}`} className="text-navy underline">
                Client result
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3 border-t border-charcoal/20 pt-6">
        <h2 className="font-heading text-2xl font-bold text-navy">Full questionnaire (wireframe)</h2>
        <p className="text-sm leading-6">
          The long &quot;Let us get to know you&quot; questionnaire. Each sample household shows what the
          team would see after it is submitted.
        </p>
        <Link href="/questionnaire" className="self-start text-sm font-semibold text-navy underline">
          Try the full questionnaire
        </Link>
        <ul className="flex flex-col gap-2">
          {households.map((h) => (
            <li key={h.id} className="flex flex-col gap-1 rounded-xl bg-white/70 p-4 shadow-sm">
              <Link href={`/team/questionnaire/${h.id}`} className="font-semibold text-navy underline">
                {h.label}
              </Link>
              <p className="text-sm text-charcoal/70">Intended: {h.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
