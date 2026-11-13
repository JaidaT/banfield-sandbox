import { useId } from 'react'
import type { Ref } from 'react'
import type { ClientResult } from '@/lib/quick-quiz/types'

interface Props {
  result: ClientResult
  // Inside another page (the quiz screen): a section instead of the page's main
  // area, since a page has only one.
  embedded?: boolean
  // Shows "Questionnaire complete 100%" on top: on the quiz, not on the team's
  // sample result pages.
  complete?: boolean
  // Put on the main heading, so the quiz can move the cursor there.
  headingRef?: Ref<HTMLHeadingElement>
}

// Small capital labels from the mockup ("DESIGN DNA", "WHAT HAPPENS NEXT").
const LABEL = 'text-xs font-semibold uppercase tracking-widest'

// Client-facing, laid out like the team's mockup (2026-11-13). Receives only
// ClientResult, which has no client type or fit data.
export default function ClientResultView({ result, embedded = false, complete = false, headingRef }: Props) {
  const Outer = embedded ? 'section' : 'main'
  const dnaHeadingId = useId()
  const dna = result.designDna
  return (
    <Outer
      aria-label={embedded ? 'Your results' : undefined}
      className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-10 text-charcoal sm:px-6"
    >
      {complete && (
        <div className="flex flex-col gap-2">
          <div className={`flex justify-between ${LABEL}`}>
            <p>{result.completeLabel}</p>
            <p>100%</p>
          </div>
          <div className="h-2 w-full rounded-full bg-accent" aria-hidden="true" />
        </div>
      )}

      <header className="flex flex-col gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold leading-tight outline-none">
          {result.heading}
        </h1>
        <p className="leading-7">{result.intro}</p>
      </header>

      {dna && (
        <section aria-labelledby={dnaHeadingId} className="flex flex-col gap-4 rounded-2xl bg-accent p-6">
          <p className={LABEL}>{dna.label}</p>
          <h2 id={dnaHeadingId} className="text-4xl font-bold leading-tight">
            {dna.name}
          </h2>
          <p className="text-xl font-bold leading-snug">{dna.headline}</p>
          <p className="leading-7">{dna.description}</p>
          {dna.secondary && (
            <p className={`border-t border-charcoal/30 pt-4 ${LABEL}`}>
              {dna.secondary.label} / {dna.secondary.name}
            </p>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className={LABEL}>{result.next.title}</h2>
        <p className="leading-7">{result.next.text}</p>
        {/* target="_top": leave the Squarespace iframe so booking opens full size. */}
        <a
          href={result.cta.href}
          target="_top"
          className="self-start rounded-full bg-navy px-6 py-3 font-semibold text-frost transition-opacity hover:opacity-90"
        >
          {result.cta.label}
        </a>
      </section>

      <section className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-xl font-bold">{result.thanks.title}</h2>
        <p className="text-sm">{result.thanks.text}</p>
      </section>
    </Outer>
  )
}
