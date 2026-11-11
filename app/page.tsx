import Link from "next/link";

const PRIMARY =
  "rounded-full bg-navy px-6 py-3 text-center font-semibold text-frost transition-opacity hover:opacity-90";
const SECONDARY =
  "rounded-full border-2 border-navy px-6 py-3 text-center font-semibold text-navy transition-opacity hover:opacity-90";

// One box per product: a short description, then "Try it" and its sample briefs.
function ProductBox({
  title,
  description,
  tryLink,
  samplesLink,
}: {
  title: string;
  description: string;
  tryLink: { href: string; label: string };
  samplesLink: { href: string; label: string };
}) {
  const headingId = `${title.toLowerCase().replace(/\s+/g, "-")}-heading`;
  return (
    <section aria-labelledby={headingId} className="flex flex-1 flex-col gap-4 rounded-xl bg-white/70 p-6 shadow-sm">
      <h2 id={headingId} className="font-heading text-2xl font-bold text-navy">
        {title}
      </h2>
      <p className="flex-1 text-sm leading-6">{description}</p>
      <div className="flex flex-col gap-3">
        <Link href={tryLink.href} className={PRIMARY}>
          {tryLink.label}
        </Link>
        <Link href={samplesLink.href} className={SECONDARY}>
          {samplesLink.label}
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-8 px-4 py-16 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-bold text-navy">Banfield Design Co. - prototype</h1>
        <p className="leading-7">
          Two separate questionnaires, built on one shared form. Try each one, or look at what the
          team would see for made-up sample clients.
        </p>
      </header>
      <div className="flex flex-col gap-6 md:flex-row">
        <ProductBox
          title="Quick Quiz"
          description="For website visitors, about 5 minutes. Gives the client a warm result, and the team a pre-call brief with a client type and a hot, warm or cold lead label."
          tryLink={{ href: "/quiz", label: "Try the Quick Quiz" }}
          samplesLink={{ href: "/team/quick-quiz", label: "View Quick Quiz sample briefs" }}
        />
        <ProductBox
          title="Long questionnaire"
          description="For hired clients, opened from a link Banfield sends. Gets to know the household and the home, and gives the team everything in one place."
          tryLink={{ href: "/questionnaire", label: "Try the Long Questionnaire" }}
          samplesLink={{ href: "/team/long-questionnaire", label: "View Long Questionnaire sample briefs" }}
        />
      </div>
    </main>
  );
}
