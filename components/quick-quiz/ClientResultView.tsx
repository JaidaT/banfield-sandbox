import { useId } from 'react'
import type { ReactNode, Ref } from 'react'
import RoomImage from '@/components/quick-quiz/RoomImage'
import type { Room } from '@/lib/quick-quiz/progressRooms'
import type { ClientResult } from '@/lib/quick-quiz/types'

interface Props {
  result: ClientResult
  // Inside another page (the quiz screen): a section instead of the page's main
  // area, since a page has only one.
  embedded?: boolean
  // Shows "Questionnaire complete 100%" on top: on the quiz, not on the team's
  // sample result pages.
  complete?: boolean
  // Rooms side by side above the complete bar: a "finished home"
  // (docs/ROOM_PROGRESS_PLAN.md). Left out: a plain bar.
  finishedHome?: Room[]
  // The room that builds, complete (docs/ROOM_BUILD_PLAN.md): shown beside a
  // shorter complete bar instead of the finished home.
  buildUpRoom?: ReactNode
  // "side": beside a shorter bar (version 4); "above": centred above the full
  // bar (version 5); "follow": at the right end of the full bar, where the
  // full fill ends (version 6).
  buildUpLayout?: 'side' | 'above' | 'follow'
  // Put on the main heading, so the quiz can move the cursor there.
  headingRef?: Ref<HTMLHeadingElement>
}

// Small capital labels from the mockup ("DESIGN DNA", "WHAT HAPPENS NEXT").
const LABEL = 'text-xs font-semibold uppercase tracking-widest'

// Client-facing, laid out like the team's mockup (2026-11-13). Receives only
// ClientResult, which has no client type or fit data.
export default function ClientResultView({ result, embedded = false, complete = false, finishedHome, buildUpRoom, buildUpLayout = 'side', headingRef }: Props) {
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
      {complete && (
        <div className="flex flex-col gap-2">
          <div className={`flex justify-between ${LABEL}`}>
            <p>{result.completeLabel}</p>
            <p>100%</p>
          </div>
          {buildUpRoom ? (
            buildUpLayout === 'above' || buildUpLayout === 'follow' ? (
              <div
                data-testid="complete-build-up"
                data-layout={buildUpLayout}
                aria-hidden="true"
                className={`flex flex-col gap-1 ${buildUpLayout === 'above' ? 'items-center' : 'items-end'}`}
              >
                <div className="w-2/5">{buildUpRoom}</div>
                <div className="h-3.5 w-full rounded-full border-2 border-accent bg-accent" />
              </div>
            ) : (
              <div data-testid="complete-build-up" data-layout="side" aria-hidden="true" className="flex items-end gap-3">
                <div className="flex-[3] pb-1">
                  <div className="h-3.5 w-full rounded-full border-2 border-accent bg-accent" />
                </div>
                <div className="flex-[2]">{buildUpRoom}</div>
              </div>
            )
          ) : (
          <div aria-hidden="true" className="flex flex-col gap-1">
            {finishedHome && finishedHome.length > 0 && (
              <div data-testid="finished-home" className="flex h-14 items-end justify-around sm:h-[72px]">
                {finishedHome.map((room) => (
                  <RoomImage key={room.file} room={room} />
                ))}
              </div>
            )}
            <div className="h-3.5 w-full rounded-full border-2 border-accent bg-accent" />
          </div>
          )}
        </div>
      )}

      <header className="flex flex-col gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold leading-tight outline-none">
          {result.heading}
        </h1>
        <p className="leading-7">{result.intro}</p>
      </header>

      {dna && (
        <>
          <section aria-labelledby={dnaHeadingId} className="flex flex-col gap-4 rounded-2xl bg-accent p-6">
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
        <p className="text-sm">{result.thanks.text}</p>
      </section>
    </Outer>
  )
}
