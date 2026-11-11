import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
        Banfield Design Co. - prototype
      </p>
      <h1 className="font-heading text-4xl font-bold text-navy">Quick Quiz</h1>
      <p className="leading-7">
        This prototype shows the Quick Quiz and what it produces: a warm result screen for the
        client and a pre-call brief for the team. Try the quiz yourself, or look at the briefs for
        made-up sample clients.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/quiz"
          className="rounded-full bg-navy px-6 py-3 font-semibold text-frost transition-opacity hover:opacity-90"
        >
          Try the Quick Quiz
        </Link>
        <Link
          href="/team"
          className="rounded-full border-2 border-navy px-6 py-3 font-semibold text-navy transition-opacity hover:opacity-90"
        >
          View sample briefs
        </Link>
      </div>
    </main>
  );
}
