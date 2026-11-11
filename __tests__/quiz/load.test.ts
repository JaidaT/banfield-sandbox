import { describe, expect, test } from 'vitest'
import { loadArchetypes, loadQuizForm, parseArchetypes, parseQuizForm } from '@/lib/quiz/load'

describe('loadArchetypes', () => {
  test('loads every archetype from data/archetypes.json', () => {
    const archetypes = loadArchetypes()
    expect(archetypes.map((a) => a.id)).toEqual([
      'decisive_delegator',
      'analytical_validator',
      'cautious_reassurance_seeker',
      'creative_collaborator',
      'hands_on_controller',
    ])
  })

  test('each archetype has the guidance fields the team brief needs', () => {
    for (const a of loadArchetypes()) {
      expect(a.label).toBeTruthy()
      expect(a.communication).toBeTruthy()
      expect(a.pacing).toBeTruthy()
      expect(a.pitch).toBeTruthy()
      expect(a.risks.length).toBeGreaterThan(0)
    }
  })
})

describe('parseArchetypes', () => {
  test('throws when an archetype is missing a required field', () => {
    const bad = { archetypes: [{ id: 'x', label: 'X' }], segments: {} }
    expect(() => parseArchetypes(bad)).toThrow(/x.*communication/)
  })

  test('throws on duplicate archetype ids', () => {
    const one = {
      id: 'dup',
      label: 'Dup',
      tagline: '',
      description: '',
      segments: [],
      signals: [],
      communication: 'c',
      pacing: 'p',
      pitch: 'p',
      risks: ['r'],
      brief_tips: '',
    }
    expect(() => parseArchetypes({ archetypes: [one, one], segments: {} })).toThrow(/duplicate.*dup/i)
  })

  test('throws when an archetype references an unknown segment', () => {
    const a = {
      id: 'a',
      label: 'A',
      tagline: '',
      description: '',
      segments: ['nowhere'],
      signals: [],
      communication: 'c',
      pacing: 'p',
      pitch: 'p',
      risks: ['r'],
      brief_tips: '',
    }
    expect(() => parseArchetypes({ archetypes: [a], segments: {} })).toThrow(/nowhere/)
  })
})

// A small valid copy of data/quiz-form.json; each test changes one thing.
function quizForm(): Record<string, unknown> {
  return {
    contactRequired: false,
    welcome: { title: 'Welcome', intro: 'About 5 minutes.' },
    contact: {
      title: 'Where should Jamie reach you?',
      introWhenRequired: 'So Jamie can follow up.',
      introWhenOptional: 'Optional: leave it blank to go straight to your results.',
      name: 'Your name',
      email: 'Email',
      phone: 'Phone',
      street: 'Project street address',
      city: 'City',
      postalCode: 'Postal code',
    },
  }
}

describe('loadQuizForm', () => {
  test('loads the wording and the contactRequired setting from data/quiz-form.json', () => {
    const form = loadQuizForm()
    expect(form.contactRequired).toBe(false)
    expect(form.welcome.title).not.toBe('')
    expect(form.contact.title).toBe('Where should Jamie reach you?')
    expect(Object.keys(form.contact).sort()).toEqual(
      ['city', 'email', 'introWhenOptional', 'introWhenRequired', 'name', 'phone', 'postalCode', 'street', 'title'].sort(),
    )
  })
})

describe('parseQuizForm', () => {
  test('accepts a valid file', () => {
    expect(parseQuizForm(quizForm()).contact.name).toBe('Your name')
  })

  test('throws when contactRequired is not true or false', () => {
    expect(() => parseQuizForm({ ...quizForm(), contactRequired: 'no' })).toThrow(/contactRequired.*true or false/)
    expect(() => parseQuizForm({ ...quizForm(), contactRequired: undefined })).toThrow(/contactRequired.*true or false/)
  })

  test('throws when any wording is missing, naming it', () => {
    const noWelcome = { ...quizForm(), welcome: { title: 'Welcome' } }
    expect(() => parseQuizForm(noWelcome)).toThrow(/quiz form is missing "welcome.intro"/)
    const contact = quizForm().contact as Record<string, unknown>
    const noPhone = { ...quizForm(), contact: { ...contact, phone: '' } }
    expect(() => parseQuizForm(noPhone)).toThrow(/quiz form is missing "contact.phone"/)
    expect(() => parseQuizForm({ ...quizForm(), contact: undefined })).toThrow(/quiz form is missing "contact"/)
    expect(() => parseQuizForm(null)).toThrow(/quiz form must be an object/)
  })
})
