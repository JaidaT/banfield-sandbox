import type { ClientResult } from '@/lib/quiz/types'

// Client-facing. Receives only ClientResult, which has no archetype or fit data.
export default function ClientResultView({ result }: { result: ClientResult }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-bold leading-tight text-navy">{result.greeting}</h1>
        <p className="text-base leading-7">{result.intro}</p>
      </header>

      {result.sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-bold text-navy">{section.title}</h2>
          <ul className="flex flex-col gap-1.5 leading-7">
            {section.lines.map((line) => (
              <li key={line} className="border-l-2 border-accent pl-3">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-4 rounded-2xl bg-navy p-6 text-frost">
        <p className="font-heading text-2xl font-bold">{result.closing}</p>
        <p className="leading-7">{result.cta.text}</p>
        {/* target="_top": leave the Squarespace iframe so booking opens full size. */}
        <a
          href={result.cta.href}
          target="_top"
          className="self-start rounded-full bg-accent px-6 py-3 font-semibold text-charcoal transition-opacity hover:opacity-90"
        >
          {result.cta.label}
        </a>
        <p className="text-sm text-frost/80">{result.cta.fallback}</p>
      </section>
    </main>
  )
}
