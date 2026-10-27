import Link from "next/link";
import { buildTeamBrief } from "@/lib/quiz/buildTeamBrief";
import { loadQuizData, loadSampleSubmissions } from "@/lib/quiz/load";

export default function TeamIndex() {
  const data = loadQuizData();
  const samples = loadSampleSubmissions();

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
    </main>
  );
}
