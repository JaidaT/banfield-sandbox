import { parseQuestionnaire } from '@/lib/questionnaire/parse'
import { isBlank } from '@/lib/questionnaire/validate'
import type { Answers, AnswerValue, Questionnaire } from '@/lib/questionnaire/types'
import type { Question, QuizForm, Submission } from './types'

// Turns the Quick Quiz into the shared form's format, so the quiz can use the
// same screens as the long questionnaire (DECISIONS.md, 2026-11-10). The quiz
// question bank and its scoring stay as they are; only what the screens need
// is passed on, so weights and fit markers never reach the form.
//
// lib/quiz may use lib/questionnaire; lib/questionnaire never uses lib/quiz.

// The contact screen's question ids, one per contact detail. Kept apart from
// the quiz question ids so a contact detail is never scored.
export const CONTACT_FIELDS = {
  name: 'contact_name',
  email: 'contact_email',
  phone: 'contact_phone',
  street: 'contact_street',
  city: 'contact_city',
  postalCode: 'contact_postal_code',
} as const

// One quiz question in the shared form's shape. "text" becomes "long_text";
// sliders are money (the only slider is investment).
function formQuestion(question: Question): Record<string, unknown> {
  const shared: Record<string, unknown> = { id: question.id, prompt: question.prompt }
  if (question.help) shared.help = question.help
  const options = question.options.map((o) => ({ id: o.id, label: o.label }))

  switch (question.kind) {
    case 'text':
      return { ...shared, kind: 'long_text' }
    case 'single':
      return { ...shared, kind: 'single', options }
    case 'multi':
      return { ...shared, kind: 'multi', options, maxSelections: question.maxSelections }
    case 'range':
      return {
        ...shared,
        kind: 'range',
        min: question.min,
        max: question.max,
        step: question.step,
        format: 'money',
        options: options.length > 0 ? options : undefined,
      }
  }
}

// The whole quiz as a shared-form questionnaire: a welcome screen, one screen
// per question (headed with the welcome title, the question as its label),
// then the contact screen. Checked by the shared loader, like the long one.
export function quizQuestionnaire(questions: Question[], form: QuizForm): Questionnaire {
  const { contact, contactRequired } = form
  const contactQuestion = (field: keyof typeof CONTACT_FIELDS) => ({
    id: CONTACT_FIELDS[field],
    kind: 'short_text',
    prompt: contact[field],
    required: contactRequired,
  })

  const raw = {
    steps: [
      { id: 'welcome', title: form.welcome.title, intro: form.welcome.intro, questions: [] },
      ...questions.map((q) => ({ id: q.id, title: form.welcome.title, questions: [formQuestion(q)] })),
      {
        id: 'contact',
        title: contact.title,
        intro: contactRequired ? contact.introWhenRequired : contact.introWhenOptional,
        questions: (Object.keys(CONTACT_FIELDS) as (keyof typeof CONTACT_FIELDS)[]).map(contactQuestion),
      },
    ],
  }
  // JSON round-trip drops the undefined fields, as if read from a data file.
  return parseQuestionnaire(JSON.parse(JSON.stringify(raw)))
}

// The form's answers as a Quick Quiz submission, ready for scoring: contact
// answers go into `contact` (blank ones become ""), every other answer stays
// keyed by its quiz question id. Blank answers are left out, so they count as
// skipped, a behavioural note in the brief.
export function answersToSubmission(answers: Answers, durationSeconds: number, id: string): Submission {
  const text = (field: keyof typeof CONTACT_FIELDS) => {
    const value = answers[CONTACT_FIELDS[field]]
    return typeof value === 'string' ? value.trim() : ''
  }
  const contactIds = new Set<string>(Object.values(CONTACT_FIELDS))
  const quizAnswers: Submission['answers'] = {}
  for (const [questionId, value] of Object.entries(answers)) {
    if (contactIds.has(questionId) || isBlank(value)) continue
    // Quiz questions only ever give text, a list of choices, or a number.
    if (typeof value === 'string' || typeof value === 'number' || isChoiceList(value)) {
      quizAnswers[questionId] = value
    }
  }
  return {
    id,
    contact: {
      name: text('name'),
      email: text('email'),
      phone: text('phone'),
      siteAddress: { street: text('street'), city: text('city'), postalCode: text('postalCode') },
    },
    answers: quizAnswers,
    durationSeconds,
  }
}

function isChoiceList(value: AnswerValue): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

// The reverse, for tests and demo links: a submission as the form's answers.
export function submissionToAnswers(submission: Submission): Answers {
  const { contact } = submission
  const details: Record<keyof typeof CONTACT_FIELDS, string> = {
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    street: contact.siteAddress.street,
    city: contact.siteAddress.city,
    postalCode: contact.siteAddress.postalCode,
  }
  const answers: Answers = { ...submission.answers }
  for (const [field, value] of Object.entries(details) as [keyof typeof CONTACT_FIELDS, string][]) {
    if (value.trim() !== '') answers[CONTACT_FIELDS[field]] = value
  }
  return answers
}
