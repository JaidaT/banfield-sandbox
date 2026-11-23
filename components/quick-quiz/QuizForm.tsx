'use client'

import type { CSSProperties } from 'react'
import { createContext, use, useEffect, useRef, useState } from 'react'
import ClientResultView from '@/components/quick-quiz/ClientResultView'
import { useEmbedBridge } from '@/components/quick-quiz/useEmbedBridge'
import SwatchCardScreen from '@/components/quick-quiz/SwatchCardScreen'
import BuildUpRoom from '@/components/quick-quiz/BuildUpRoom'
import RoomAndBar from '@/components/quick-quiz/RoomAndBar'
import { STRIP } from '@/components/quick-quiz/stripStyles'
import { loadSwatchLook } from '@/lib/quick-quiz/swatchLook'
import { loadRoomBuild } from '@/lib/quick-quiz/roomBuild'
import { CALCULATING_MS } from '@/components/quick-quiz/motion'
import QuestionnaireForm from '@/components/form/QuestionnaireForm'
import type { DoneScreenProps } from '@/components/form/QuestionnaireForm'
import { buildClientResult } from '@/lib/quick-quiz/buildClientResult'
import { designDnaFor } from '@/lib/quick-quiz/designDna'
import { answersToSubmission } from '@/lib/quick-quiz/toQuestionnaire'
import type { Answers, Questionnaire } from '@/lib/form/types'
import type { ClientCopy, QuizData } from '@/lib/quick-quiz/types'

interface Props {
  // The quiz converted to the shared form's format (quizQuestionnaire).
  questionnaire: Questionnaire
  // The question bank, archetypes and lead rules, for scoring.
  quizData: QuizData
  // The client result wording (data/quick-quiz/client-result.json).
  clientCopy: ClientCopy
  // For tests and demo links: open on this step with these answers.
  startAt?: string
  initialAnswers?: Answers
}

// What the result screen needs from the quiz. Shared through context because
// the shared form only gives its final screen the answers and a heading ref.
interface QuizSetup {
  quizData: QuizData
  clientCopy: ClientCopy
  // null until "Let's start" is pressed.
  startedAt: number | null
}
const QuizContext = createContext<QuizSetup | null>(null)

// Inside the website's iframe, the quiz is at least this tall (null: it fits
// each card). Used by the iframe rule in app/globals.css.
const EMBED_MIN = loadSwatchLook().embedMinHeight
const EMBED_MIN_STYLE = EMBED_MIN
  ? ({ '--embed-min-phone': `${EMBED_MIN.phone}px`, '--embed-min-computer': `${EMBED_MIN.computer}px` } as CSSProperties)
  : undefined

// Every piece of the room that builds (docs/SWATCH_ROOMS_PLAN.md).
const ALL_PIECES = loadRoomBuild().pieces.length

// The Quick Quiz: the shared form's screens (one question per screen, contact
// last, no review screen), ending on the quiz's own result screen.
export default function QuizForm({ questionnaire, quizData, clientCopy, startAt, initialAnswers }: Props) {
  // When "Let's start" was pressed, for the "time taken" note in the brief (a
  // note only, with no effect on scoring; DECISIONS.md 2026-10-26). Reading the
  // welcome screen does not count. performance.now() is the timer: Next.js does
  // not allow Date.now() while it prepares the page ahead of time, and says
  // performance.now() is meant for timing.
  const [startedAt, setStartedAt] = useState<number | null>(null)
  // Only the first press counts, even if they go Back to the welcome screen.
  const start = () => setStartedAt((first) => first ?? performance.now())
  // Inside an iframe on a website: tells the page the quiz's height and when a
  // new screen shows (DECISIONS.md 2026-11-15). On its own page it does nothing.
  const wrapper = useRef<HTMLDivElement>(null)
  const notifyNewScreen = useEmbedBridge(wrapper)
  // After each move: tell the website around the iframe, or, on the quiz's
  // own page, scroll the quiz's top (the room) into view if it is above the
  // screen. On a short phone the room otherwise ended up scrolled out of view
  // above the new question (Jaida, 2026-11-22).
  const afterMove = () => {
    notifyNewScreen()
    if (window.parent !== window) return // the website's script scrolls instead
    const top = wrapper.current?.getBoundingClientRect().top
    if (top === undefined || top >= 0) return
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: window.scrollY + top, behavior: reduce ? 'auto' : 'smooth' })
  }
  return (
    <QuizContext value={{ quizData, clientCopy, startedAt }}>
      {/* flex-1 keeps the page filling the window, as before. */}
      <div ref={wrapper} data-embed-min={EMBED_MIN ? '' : undefined} style={EMBED_MIN_STYLE} className="flex flex-1 flex-col">
        <QuestionnaireForm
          questionnaire={questionnaire}
          startAt={startAt}
          initialAnswers={initialAnswers}
          skipReview
          progressAs="percent"
          look="quick-quiz"
          onStart={start}
          onScreenChange={afterMove}
          focusWithoutScroll
          stepScreen={SwatchCardScreen}
          doneScreen={QuizResults}
        />
      </div>
    </QuizContext>
  )
}

// The final screen. Swatch cards (docs/SWATCH_CARDS_PLAN.md): the cards fall
// away, "Calculating your Design DNA" shows for 2 seconds, then the client
// result appears and the cursor moves to its heading. The result is already
// worked out; the pause is for effect. Demo styling (2026-11-17): the team
// brief is not shown under it; the brief opens from the sample list instead.
function QuizResults({ answers }: DoneScreenProps) {
  const setup = use(QuizContext)
  if (!setup) throw new Error('QuizResults must be inside QuizForm')
  const { quizData, clientCopy, startedAt } = setup
  // Worked out once, when the results first show. 0 when the quiz was opened
  // past the welcome screen (tests and demo links), so "Let's start" was never pressed.
  const [seconds] = useState(() =>
    startedAt === null ? 0 : Math.max(0, Math.round((performance.now() - startedAt) / 1000)),
  )

  // "quiz-demo": a placeholder id until submissions are saved (Later in the plan).
  const submission = answersToSubmission(answers, seconds, 'quiz-demo')
  const result = buildClientResult(submission, clientCopy, designDnaFor(submission, quizData))

  const [calculating, setCalculating] = useState(true)
  const resultHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const timer = setTimeout(() => setCalculating(false), CALCULATING_MS)
    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    if (!calculating) resultHeading.current?.focus()
  }, [calculating])

  if (calculating) return <Calculating />
  return (
    <div className="result-reveal">
      <ClientResultView result={result} embedded complete room={<BuildUpRoom shownCount={ALL_PIECES} showBase={false} />} headingRef={resultHeading} />
    </div>
  )
}

// "Calculating your Design DNA" with dots appearing one by one (still with
// reduced motion), while the cards fall out of the quiz's area behind it.
// The room and the full bar stay at the top, and the last piece (the plants)
// pops in, completing the room (docs/SWATCH_ROOMS_PLAN.md).
function Calculating() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <RoomAndBar shownCount={ALL_PIECES} percent={100} popLast />
      <div className="relative flex min-h-80 flex-1 flex-col items-center justify-center overflow-hidden">
        <div data-testid="falling-cards" aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80">
          <div className="card-fall absolute inset-x-4 top-0 h-72 rounded-2xl border-2 border-[var(--line)] bg-white [animation-delay:60ms]" />
          <div className="card-fall absolute inset-x-0 top-10 h-72 overflow-hidden rounded-2xl border-2 border-[var(--line)] bg-white">
            <div className={`h-16 ${STRIP.strip}`} />
          </div>
        </div>
        <p role="status" className="calculating text-center text-xl font-bold text-charcoal">
          Calculating your Design DNA
          <span aria-hidden="true" className="calc-dots">
            <span> .</span>
            <span> .</span>
            <span> .</span>
          </span>
        </p>
      </div>
    </div>
  )
}
