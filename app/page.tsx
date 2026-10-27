import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
        Banfield Design Co. - prototype
      </p>
      <h1 className="font-heading text-4xl font-bold text-navy">Quick Quiz outputs</h1>
      <p className="leading-7">
        This prototype shows what the Quick Quiz produces: a pre-call brief for the team and a
        warm result screen for the client. The quiz screen itself is not built yet, so the pages
        use made-up sample submissions.
      </p>
      <Link
        href="/team"
        className="self-start rounded-full bg-navy px-6 py-3 font-semibold text-frost transition-opacity hover:opacity-90"
      >
        View sample briefs
      </Link>
    </main>
  );
}
