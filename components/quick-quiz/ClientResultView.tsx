import Image from 'next/image'
import { useId } from 'react'
import type { ReactNode, Ref } from 'react'
import { ROOM_BOX } from '@/components/quick-quiz/stripStyles'
import type { ClientResult } from '@/lib/quick-quiz/types'

interface Props {
  result: ClientResult
  // Inside another page (the quiz screen): a section instead of the page's main
  // area, since a page has only one.
  embedded?: boolean
  // The quiz's own result (not the team's sample result pages): shows the
  // finished room on top, when given.
  complete?: boolean
  // The complete room that builds, centred on top (docs/SWATCH_ROOMS_PLAN.md).
  // No progress bar on the result (Jaida, 2026-11-23).
  room?: ReactNode
  // Put on the main heading, so the quiz can move the cursor there.
  headingRef?: Ref<HTMLHeadingElement>
}

// Small capital labels from the mockup ("DESIGN DNA", "WHAT HAPPENS NEXT").
const LABEL = 'text-xs font-semibold uppercase tracking-widest'

// Client-facing, laid out like the team's mockup (2026-11-13). Receives only
// ClientResult, which has no client type or fit data.
export default function ClientResultView({ result, embedded = false, complete = false, room, headingRef }: Props) {
  const Outer = embedded ? 'section' : 'main'
  const dnaHeadingId = useId()
  const helpHeadingId = useId()
  const dna = result.designDna
  return (
    <Outer
      aria-label={embedded ? 'Your results' : undefined}
      // Inside the quiz, the quiz page already gives the side margins.
      className={`mx-auto flex w-full max-w-xl flex-col gap-8 text-charcoal ${embedded ? 'py-2' : 'px-4 py-10 sm:px-6'}`}
    >
      {/* No progress bar or "Questionnaire complete 100%" line on the result
          (Jaida, 2026-11-23): just the finished room, centred. */}
      {complete && room ? (
        <div aria-hidden="true" className="flex justify-center">
          <div className={ROOM_BOX.className} style={ROOM_BOX.style}>
            {room}
          </div>
        </div>
      ) : null}

      <header className="flex flex-col gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold leading-tight outline-none">
          {result.heading}
        </h1>
        <p className="leading-7">{result.intro}</p>
      </header>

      {dna && (
        <>
          <section aria-labelledby={dnaHeadingId} className="flex flex-col gap-4 rounded-2xl bg-accent p-6">
            {/* The profile's mascot, centred at the top of the card (Jaida,
                2026-11-27, docs/WELCOME_MASCOTS_PLAN.md). */}
            {dna.mascot ? (
              <Image
                src={dna.mascot.file}
                alt={dna.mascot.alt}
                width={176}
                height={176}
                unoptimized
                className="mx-auto h-36 w-36 object-contain sm:h-44 sm:w-44"
              />
            ) : null}
            <p className={LABEL}>{dna.label}</p>
            <h2 id={dnaHeadingId} className="text-4xl font-bold leading-tight">
              {dna.name}
            </h2>
            <p className="text-xl font-bold leading-snug">{dna.headline}</p>
            <p className="leading-7">{dna.description}</p>
          </section>

          {/* "How we can help": written for this profile (design-dna.json). */}
          <section aria-labelledby={helpHeadingId} className="flex flex-col gap-3">
            <h2 id={helpHeadingId} className={LABEL}>
              {dna.help.label}
            </h2>
            <ul className="flex flex-col gap-4">
              {dna.help.points.map((point) => (
                <li key={point.title} className="flex flex-col gap-1 border-l-4 border-accent pl-4">
                  <strong className="font-semibold">{point.title}</strong>
                  <span className="leading-7">{point.text}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
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
        {result.thanks.text ? <p className="text-sm">{result.thanks.text}</p> : null}
      </section>
    </Outer>
  )
}
