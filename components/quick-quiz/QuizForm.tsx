'use client'

import { createContext, use, useState } from 'react'
import ClientResultView from '@/components/quick-quiz/ClientResultView'
import TeamBriefView from '@/components/quick-quiz/TeamBriefView'
import QuestionnaireForm from '@/components/form/QuestionnaireForm'
import type { DoneScreenProps } from '@/components/form/QuestionnaireForm'
import { buildClientResult } from '@/lib/quick-quiz/buildClientResult'
import { designDnaFor } from '@/lib/quick-quiz/designDna'
import { buildTeamBrief } from '@/lib/quick-quiz/buildTeamBrief'
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
  return (
    <QuizContext value={{ quizData, clientCopy, startedAt }}>
      <QuestionnaireForm
        questionnaire={questionnaire}
        startAt={startAt}
        initialAnswers={initialAnswers}
        skipReview
        onStart={start}
        doneScreen={QuizResults}
      />
    </QuizContext>
  )
}

// The final screen: the client result, then (prototype only) the team brief
// under a divider. In the real product the brief is sent to the team, not shown.
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
  const brief = buildTeamBrief(submission, quizData)

  return (
    <>
      <ClientResultView result={result} embedded complete headingRef={headingRef} />
      <section aria-label="Team view (demo only)" className="mt-6 border-t-4 border-double border-neutral-400 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-600">Team view (demo only)</p>
        <TeamBriefView brief={brief} embedded />
      </section>
    </>
  )
}
