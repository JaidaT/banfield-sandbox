'use client'

import PickImages from './PickImages'
import QuestionField from './QuestionField'
import RangeField from './RangeField'
import Repeater from './Repeater'
import type { AnswerValue, ImagePicks, Question, RepeaterEntry } from '@/lib/form/types'

interface Props {
  question: Question
  value: AnswerValue | undefined
  onChange: (value: AnswerValue | undefined) => void
  error?: string
}

// Picks the right input for a question's kind:
// - "repeater" -> "Add another" cards (Repeater)
// - "pick_images" -> favourite and least favourite pictures (PickImages)
// - "range" -> a slider, with buttons for choices such as "Not sure yet" (RangeField)
// - everything else -> a text box, number box, radio buttons or tick boxes (QuestionField)
export default function QuestionInput({ question, value, onChange, error }: Props) {
  if (question.kind === 'range') {
    return <RangeField question={question} value={value} onChange={onChange} error={error} />
  }
  if (question.kind === 'repeater') {
    return <Repeater question={question} value={value as RepeaterEntry[] | undefined} onChange={onChange} error={error} />
  }
  if (question.kind === 'pick_images') {
    return <PickImages question={question} value={value as ImagePicks | undefined} onChange={onChange} error={error} />
  }
  return <QuestionField question={question} value={value} onChange={onChange} error={error} />
}
