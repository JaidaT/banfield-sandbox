'use client'

import { createContext, use, useRef, useState } from 'react'
import ClientResultView from '@/components/quick-quiz/ClientResultView'
import { useEmbedBridge } from '@/components/quick-quiz/useEmbedBridge'
import RoomProgressBar from '@/components/quick-quiz/RoomProgressBar'
import BuildUpRoom from '@/components/quick-quiz/BuildUpRoom'
import { loadRoomBuild } from '@/lib/quick-quiz/roomBuild'
import { isBuildUp, loadProgressRooms } from '@/lib/quick-quiz/progressRooms'
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

// The rooms on the result's 100% bar (docs/ROOM_PROGRESS_PLAN.md).
const FINISHED_HOME = loadProgressRooms().finishedHome
// With the room that builds on, the result shows that room complete instead,
// its last piece popping in (docs/ROOM_BUILD_PLAN.md).
const PLACEMENT = loadProgressRooms().placement
const BUILD_UP = isBuildUp(PLACEMENT)
const BUILD_UP_LAYOUT = PLACEMENT === 'build-up-middle' ? 'above' : PLACEMENT === 'build-up-follow' ? 'follow' : 'side'
const BUILD_PIECES = loadRoomBuild().pieces.length

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
  return (
    <QuizContext value={{ quizData, clientCopy, startedAt }}>
      {/* flex-1 keeps the page filling the window, as before. */}
      <div ref={wrapper} className="flex flex-1 flex-col">
        <QuestionnaireForm
          questionnaire={questionnaire}
          startAt={startAt}
          initialAnswers={initialAnswers}
          skipReview
          progressAs="percent"
          look="quick-quiz"
          progressBar={RoomProgressBar}
          onStart={start}
          onScreenChange={notifyNewScreen}
          doneScreen={QuizResults}
        />
      </div>
    </QuizContext>
  )
}

// The final screen: the client result. Demo styling (2026-11-17): the team
// brief is not shown under it; the brief opens from the sample list instead.
function QuizResults({ answers, headingRef }: DoneScreenProps) {
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

  return <ClientResultView result={result} embedded complete
      finishedHome={BUILD_UP ? undefined : FINISHED_HOME}
      buildUpRoom={BUILD_UP ? <BuildUpRoom shownCount={BUILD_PIECES} popLast /> : undefined}
      buildUpLayout={BUILD_UP_LAYOUT}
      headingRef={headingRef}
    />
}
