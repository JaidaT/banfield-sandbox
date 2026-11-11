'use client'

import { createContext, use, useState } from 'react'
import ClientResultView from '@/components/ClientResultView'
import TeamBriefView from '@/components/TeamBriefView'
import QuestionnaireForm from '@/components/questionnaire/QuestionnaireForm'
import type { DoneScreenProps } from '@/components/questionnaire/QuestionnaireForm'
import { buildClientResult } from '@/lib/quiz/buildClientResult'
import { buildTeamBrief } from '@/lib/quiz/buildTeamBrief'
import { answersToSubmission } from '@/lib/quiz/toQuestionnaire'
import type { Answers, Questionnaire } from '@/lib/questionnaire/types'
import type { ClientCopy, QuizData } from '@/lib/quiz/types'

interface Props {
  // The quiz converted to the shared form's format (quizQuestionnaire).
  questionnaire: Questionnaire
  // The question bank, archetypes and lead rules, for scoring.
  quizData: QuizData
  // The client result wording (data/client-result.json).
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
  startedAt: number
}
const QuizContext = createContext<QuizSetup | null>(null)

// The Quick Quiz: the shared form's screens (one question per screen, contact
// last, no review screen), ending on the quiz's own result screen.
export default function QuizForm({ questionnaire, quizData, clientCopy, startAt, initialAnswers }: Props) {
  // When the quiz opened, for the "time taken" note in the brief (a note only,
  // with no effect on scoring; DECISIONS.md 2026-10-26).
  const [startedAt] = useState(() => Date.now())
  return (
    <QuizContext value={{ quizData, clientCopy, startedAt }}>
      <QuestionnaireForm
        questionnaire={questionnaire}
        startAt={startAt}
        initialAnswers={initialAnswers}
        skipReview
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
  // Worked out once, when the results first show.
  const [seconds] = useState(() => Math.max(0, Math.round((Date.now() - startedAt) / 1000)))

  // "quiz-demo": a placeholder id until submissions are saved (Later in the plan).
  const submission = answersToSubmission(answers, seconds, 'quiz-demo')
  const result = buildClientResult(submission, quizData.questions, clientCopy)
  const brief = buildTeamBrief(submission, quizData)

  return (
    <>
      <ClientResultView result={result} embedded headingRef={headingRef} />
      <section aria-label="Team view (demo only)" className="mt-6 border-t-4 border-double border-neutral-400 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-600">Team view (demo only)</p>
        <TeamBriefView brief={brief} embedded />
      </section>
    </>
  )
}
