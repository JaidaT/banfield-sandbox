import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Embed test (prototype)",
  description: "A stand-in website page with the Quick Quiz in an iframe, for testing on phones.",
  robots: { index: false, follow: false },
};

const MENU = ["Services", "Portfolio", "About", "Contact"];

// The on/off switch. Plain <a> links (not next/link) so each version is a
// fresh page load, like a real visit.
function Switch({ fixesOn }: { fixesOn: boolean }) {
  const option = (label: string, href: string, current: boolean) => (
    <a
      href={href}
      aria-current={current ? "page" : undefined}
      className={`rounded-full border-2 border-navy px-3 py-1 font-semibold ${current ? "bg-navy text-white" : "text-navy"}`}
    >
      {label}
    </a>
  );
  return (
    <nav aria-label="Iframe fixes" className="flex flex-wrap items-center gap-2 text-sm">
      {option("Fixes on", "/embed-test", fixesOn)}
      {option("Fixes off", "/embed-test?fixes=off", !fixesOn)}
      <span>
        {fixesOn
          ? "Showing: the iframe resizes to fit the quiz, and each new screen scrolls to the top of the quiz."
          : "Showing: a plain 600px iframe with its own scroll box, as Squarespace would show it without the script."}
      </span>
    </nav>
  );
}

// The stand-in website page (DECISIONS.md 2026-11-15). Generic on purpose: no
// Banfield name, logo or copied content.
export function EmbedTestView({ fixesOn }: { fixesOn: boolean }) {
  return (
    <div className="flex flex-1 flex-col bg-white">
      {fixesOn && <script src="/quick-quiz-embed.js" async />}
      <p className="border-b-2 border-dashed border-neutral-400 bg-neutral-100 px-4 py-2 text-center text-xs font-semibold">
        Test page: imitates a website like Banfield&apos;s, to try the Quick Quiz in an iframe. Not a real site.
      </p>
      <header data-sticky-header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-navy px-4 py-4 text-white">
        <span className="font-heading text-lg font-bold">Design Studio</span>
        <span className="flex gap-3 text-sm max-sm:hidden">
          {MENU.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </span>
        <span className="text-sm sm:hidden">Menu</span>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <Switch fixesOn={fixesOn} />
        <h1 className="font-heading text-3xl font-bold text-navy">Find your Design DNA</h1>
        <p className="leading-7">
          Take our five-minute quiz to discover your design approach. This text stands in for the website content
          above the quiz.
        </p>
        <iframe
          src="/quiz"
          title="Quick Quiz"
          data-quick-quiz={fixesOn ? "" : undefined}
          style={fixesOn ? undefined : { height: 600 }}
          // With fixes on, this is only the starting height until the quiz sends its own.
          className={`w-full border-0 ${fixesOn ? "h-[600px]" : ""}`}
        />
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-2xl font-bold text-navy">More about the studio</h2>
          {[1, 2, 3].map((n) => (
            <p key={n} className="leading-7">
              More website content below the quiz, so the page scrolls like a real one. A real page would have
              projects, testimonials and contact details here.
            </p>
          ))}
        </section>
      </main>

      <footer className="mt-auto bg-charcoal px-4 py-8 text-sm text-white">Website footer (stand-in)</footer>
    </div>
  );
}

// Reads ?fixes=off from the address.
export async function EmbedTestContent({ searchParams }: { searchParams: PageProps<"/embed-test">["searchParams"] }) {
  const { fixes } = await searchParams;
  return <EmbedTestView fixesOn={fixes !== "off"} />;
}

// /embed-test (fixes on) and /embed-test?fixes=off. Not linked from the home page.
export default function EmbedTestPage({ searchParams }: PageProps<"/embed-test">) {
  return (
    <Suspense fallback={<p className="px-4 py-8">Loading...</p>}>
      <EmbedTestContent searchParams={searchParams} />
    </Suspense>
  );
}
