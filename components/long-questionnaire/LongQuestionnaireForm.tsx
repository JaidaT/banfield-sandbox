'use client'

import DoneScreen from './DoneScreen'
import QuestionnaireForm from '@/components/form/QuestionnaireForm'
import type { Answers, Questionnaire } from '@/lib/form/types'

interface Props {
  questionnaire: Questionnaire
  // For tests and demo links: open on this step with these answers.
  startAt?: string
  initialAnswers?: Answers
}

// The long "Let us get to know you" questionnaire: the shared form, with the
// review screen, ending on the long questionnaire's own thank-you screen.
export default function LongQuestionnaireForm({ questionnaire, startAt, initialAnswers }: Props) {
  return (
    <QuestionnaireForm
      questionnaire={questionnaire}
      startAt={startAt}
      initialAnswers={initialAnswers}
      doneScreen={DoneScreen}
    />
  )
}
