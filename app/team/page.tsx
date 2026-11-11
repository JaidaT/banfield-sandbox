import Link from "next/link";

// The team area: one link per product's list of results. Each product's
// samples live on its own page, as the real submissions will.
export default function TeamIndex() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2">
        <Link href="/" className="self-start text-sm font-semibold text-navy underline">
          Back to the prototype home
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">Team only</p>
        <h1 className="font-heading text-3xl font-bold text-navy">Sample results</h1>
      </header>
      <nav aria-label="Sample results" className="flex flex-col gap-3 text-lg font-semibold">
        <Link href="/team/quick-quiz" className="self-start text-navy underline">
          Quick Quiz sample briefs
        </Link>
        <Link href="/team/long-questionnaire" className="self-start text-navy underline">
          Long questionnaire sample briefs
        </Link>
      </nav>
    </main>
  );
}
