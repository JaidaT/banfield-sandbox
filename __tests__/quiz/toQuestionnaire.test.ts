import { describe, expect, test } from 'vitest'
import { loadQuestions, loadQuizForm, loadSampleSubmissions } from '@/lib/quiz/load'
import { validateSubmission } from '@/lib/quiz/submission'
import { CONTACT_FIELDS, answersToSubmission, quizQuestionnaire, submissionToAnswers } from '@/lib/quiz/toQuestionnaire'
import type { Question as FormQuestion } from '@/lib/questionnaire/types'

const questions = loadQuestions()
const form = loadQuizForm()
const built = quizQuestionnaire(questions, form)
const allQuestions = built.steps.flatMap((s) => s.questions)
const find = (id: string): FormQuestion => {
  const question = allQuestions.find((q) => q.id === id)
  if (!question) throw new Error(`no question ${id}`)
  return question
}

describe('quizQuestionnaire', () => {
  test('runs the shared form checks, so a broken question bank is refused', () => {
    // The same loader checks as the long questionnaire: a question listed twice fails
    // (caught as a duplicate screen, since each question has its own screen).
    expect(() => quizQuestionnaire([...questions, questions[0]], form)).toThrow(/duplicate .*id: decision_style/)
  })

  test('a welcome screen, one screen per quiz question in order, then the contact screen', () => {
    expect(built.steps[0]).toMatchObject({ id: 'welcome', title: form.welcome.title, intro: form.welcome.intro, questions: [] })
    const middle = built.steps.slice(1, -1)
    expect(middle.map((s) => s.questions.map((q) => q.id))).toEqual(questions.map((q) => [q.id]))
    expect(built.steps.at(-1)?.id).toBe('contact')
    expect(built.steps).toHaveLength(questions.length + 2)
  })

  test('each question screen is headed with the welcome title, and the question is its label', () => {
    for (const step of built.steps.slice(1, -1)) {
      expect(step.title, step.id).toBe(form.welcome.title)
    }
    expect(find('decision_style').prompt).toBe(questions.find((q) => q.id === 'decision_style')?.prompt)
  })

  test('question kinds carry over: text becomes long text, and choices keep their labels', () => {
    expect(find('home_meaning').kind).toBe('long_text')
    expect(find('home_meaning').help).toBe(questions.find((q) => q.id === 'home_meaning')?.help)
    expect(find('decision_style').kind).toBe('single')
    expect(find('decision_style').options[0]).toEqual({ id: 'trust_expert', label: 'Find someone who knows their stuff and go with their call' })
  })

  test('the investment slider keeps its numbers, money format and "Not sure yet"', () => {
    const investment = find('investment')
    expect(investment.kind).toBe('range')
    expect([investment.min, investment.max, investment.step]).toEqual([0, 500000, 10000])
    expect(investment.format).toBe('money')
    expect(investment.options).toEqual([{ id: 'not_sure', label: 'Not sure yet' }])
  })

  test('"pick up to two" carries over', () => {
    expect(find('confidence').kind).toBe('multi')
    expect(find('confidence').maxSelections).toBe(2)
  })

  test('no quiz question is required, and no weights or fit markers reach the form', () => {
    for (const step of built.steps.slice(1, -1)) {
      for (const q of step.questions) expect(q.required, q.id).toBe(false)
    }
    const text = JSON.stringify(built)
    expect(text).not.toContain('weights')
    expect(text).not.toContain('fitQuestion')
  })

  test('the contact screen has the six fields, required only when contactRequired is true', () => {
    const contactStep = (required: boolean) =>
      quizQuestionnaire(questions, { ...form, contactRequired: required }).steps.at(-1)!
    const optional = contactStep(false)
    expect(optional.title).toBe(form.contact.title)
    expect(optional.questions.map((q) => q.id)).toEqual(Object.values(CONTACT_FIELDS))
    expect(optional.questions.map((q) => q.prompt)).toEqual([
      form.contact.name,
      form.contact.email,
      form.contact.phone,
      form.contact.street,
      form.contact.city,
      form.contact.postalCode,
    ])
    expect(optional.questions.every((q) => q.kind === 'short_text' && !q.required)).toBe(true)
    expect(optional.intro).toBe(form.contact.introWhenOptional)

    const required = contactStep(true)
    expect(required.questions.every((q) => q.required)).toBe(true)
    expect(required.intro).toBe(form.contact.introWhenRequired)
  })

  test('contact field ids do not clash with quiz question ids', () => {
    const quizIds = new Set(questions.map((q) => q.id))
    for (const id of Object.values(CONTACT_FIELDS)) expect(quizIds.has(id), id).toBe(false)
  })
})

describe('answersToSubmission and submissionToAnswers', () => {
  test('every sample goes to form answers and back unchanged, and is still valid', () => {
    for (const sample of loadSampleSubmissions()) {
      const back = answersToSubmission(submissionToAnswers(sample), sample.durationSeconds, sample.id)
      // Everything but the sample's note, which only describes the made-up person.
      expect(back, sample.id).toEqual({ id: sample.id, contact: sample.contact, answers: sample.answers, durationSeconds: sample.durationSeconds })
      expect(validateSubmission(back, questions), sample.id).toEqual([])
    }
  })

  test('contact answers go into contact, and nothing else does', () => {
    const answers = {
      [CONTACT_FIELDS.name]: 'Pat Example',
      [CONTACT_FIELDS.email]: 'pat@example.com',
      [CONTACT_FIELDS.city]: 'Burnaby',
      coffee: 'pour_over',
    }
    const submission = answersToSubmission(answers, 240, 'quiz-1')
    expect(submission).toEqual({
      id: 'quiz-1',
      durationSeconds: 240,
      contact: {
        name: 'Pat Example',
        email: 'pat@example.com',
        phone: '',
        siteAddress: { street: '', city: 'Burnaby', postalCode: '' },
      },
      answers: { coffee: 'pour_over' },
    })
  })

  test('blank answers are left out, so they count as skipped', () => {
    const submission = answersToSubmission({ home_meaning: '   ', confidence: [], coffee: 'pour_over' }, 60, 'quiz-1')
    expect(submission.answers).toEqual({ coffee: 'pour_over' })
  })

  test('blank contact details become empty, and are valid when contact is not required', () => {
    const submission = answersToSubmission({ coffee: 'pour_over' }, 60, 'quiz-1')
    expect(submission.contact).toEqual({ name: '', email: '', phone: '', siteAddress: { street: '', city: '', postalCode: '' } })
    expect(validateSubmission(submission, questions, { contactRequired: false })).toEqual([])
  })
})
