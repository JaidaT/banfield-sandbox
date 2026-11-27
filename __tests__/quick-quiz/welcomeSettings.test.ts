import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { boldParts } from '@/lib/quick-quiz/boldText'
import { loadQuizForm, parseQuizForm } from '@/lib/quick-quiz/load'
import { loadSwatchLook, parseSwatchLook } from '@/lib/quick-quiz/swatchLook'

// The welcome screen with moving mascots (docs/WELCOME_MASCOTS_PLAN.md,
// Jaida, 2026-11-23): its wording and its settings.

// A small valid copy of data/quick-quiz/quiz-form.json with a given welcome.
function formWith(welcome: unknown): Record<string, unknown> {
  return {
    contactRequired: false,
    welcome,
    contact: {
      title: 'T',
      introWhenRequired: 'R',
      introWhenOptional: 'O',
      name: 'N',
      email: 'E',
      phone: 'P',
      street: 'S',
      city: 'C',
      postalCode: 'PC',
    },
  }
}

describe('the welcome wording (quiz-form.json)', () => {
  test('the real file has the mockup heading, two paragraphs and "Get Started"', () => {
    expect(loadQuizForm().welcome).toEqual({
      title: 'Find your Design DNA',
      intro: [
        'Discover how you approach projects, and how Banfield Design Co. can help bring your dream home to life.',
        'It takes about **5 minutes**, and there are no wrong answers.',
      ],
      button: 'Get Started',
      logo: { file: '/mascots/banfield-logo.svg', alt: 'Banfield Design Co.' },
    })
  })

  test('one paragraph can be written as plain text; the button can be left out', () => {
    expect(parseQuizForm(formWith({ title: 'Hi', intro: 'One paragraph.' })).welcome).toEqual({ title: 'Hi', intro: ['One paragraph.'] })
  })

  test('refuses no paragraphs, a blank paragraph, an unclosed ** and a blank button', () => {
    expect(() => parseQuizForm(formWith({ title: 'Hi', intro: [] }))).toThrow(/welcome.intro/)
    expect(() => parseQuizForm(formWith({ title: 'Hi', intro: ['Fine', ''] }))).toThrow(/welcome.intro/)
    expect(() => parseQuizForm(formWith({ title: 'Hi', intro: ['About **5 minutes'] }))).toThrow(/\*\*/)
    expect(() => parseQuizForm(formWith({ title: 'Hi', intro: ['Fine'], button: '' }))).toThrow(/welcome.button/)
  })

  // Jaida, 2026-11-27: the Banfield logo on the welcome card.
  test('the logo is optional; given, it needs a file in public/ and a description', () => {
    const logo = { file: '/logo.svg', alt: 'Banfield Design Co.' }
    expect(parseQuizForm(formWith({ title: 'Hi', intro: ['Fine'], logo })).welcome.logo).toEqual(logo)
    expect(() => parseQuizForm(formWith({ title: 'Hi', intro: ['Fine'], logo: { file: 'logo.svg', alt: 'B' } }))).toThrow(/welcome.logo/)
    expect(() => parseQuizForm(formWith({ title: 'Hi', intro: ['Fine'], logo: { file: '/logo.svg', alt: '' } }))).toThrow(/welcome.logo/)
  })

  test('the real logo file exists in public/', () => {
    expect(existsSync(join(process.cwd(), 'public', loadQuizForm().welcome.logo!.file))).toBe(true)
  })
})

describe('boldParts: ** marks bold text', () => {
  test('splits a paragraph into plain and bold parts', () => {
    expect(boldParts('It takes about **5 minutes**, and there are no wrong answers.')).toEqual([
      { text: 'It takes about ', bold: false },
      { text: '5 minutes', bold: true },
      { text: ', and there are no wrong answers.', bold: false },
    ])
  })

  test('plain text is one plain part', () => {
    expect(boldParts('No bold here.')).toEqual([{ text: 'No bold here.', bold: false }])
  })
})

describe('the welcome background settings (swatch-cards.json)', () => {
  // Jaida, 2026-11-27: the 5 mascots and the logo replace the placeholders, at 150px.
  test('the real file: the 5 mascots then the logo, 20 seconds per square, 150px squares with a 12px gap', () => {
    const welcome = loadSwatchLook().welcome!
    expect(welcome.pictures).toEqual([
      '/mascots/curator-capybara.svg',
      '/mascots/explorer-echidna.svg',
      '/mascots/nest-builder-nene.svg',
      '/mascots/strategist-seal.svg',
      '/mascots/visionary-vole.svg',
      '/mascots/banfield-logo.svg',
    ])
    expect(welcome.secondsPerSquare).toBe(20)
    expect(welcome.squareSize).toBe(150)
    expect(welcome.gap).toBe(12)
    expect(welcome.animate).toBe(true)
  })

  // Jaida, 2026-11-23: a switch to turn the movement on and off.
  test('"animate": true or false; left out, the columns move; anything else is refused', () => {
    const base = { pictures: ['/a.svg'], secondsPerSquare: 20, squareSize: 112, gap: 12 }
    expect(parseSwatchLook({ welcome: base }).welcome!.animate).toBe(true)
    expect(parseSwatchLook({ welcome: { ...base, animate: false } }).welcome!.animate).toBe(false)
    expect(() => parseSwatchLook({ welcome: { ...base, animate: 'no' } })).toThrow(/animate/)
  })

  test('every picture file exists in public/', () => {
    for (const file of loadSwatchLook().welcome!.pictures) {
      expect(existsSync(join(process.cwd(), 'public', file)), file).toBe(true)
    }
  })

  test('left out: no moving background', () => {
    expect(parseSwatchLook({}).welcome).toBeNull()
  })

  test('refuses no pictures, and a speed, size or gap that is not a positive number', () => {
    const good = { pictures: ['/a.svg'], secondsPerSquare: 20, squareSize: 112, gap: 12 }
    expect(parseSwatchLook({ welcome: good }).welcome).toEqual({ ...good, animate: true })
    expect(() => parseSwatchLook({ welcome: { ...good, pictures: [] } })).toThrow(/welcome/)
    expect(() => parseSwatchLook({ welcome: { ...good, pictures: [''] } })).toThrow(/welcome/)
    expect(() => parseSwatchLook({ welcome: { ...good, secondsPerSquare: 0 } })).toThrow(/welcome/)
    expect(() => parseSwatchLook({ welcome: { ...good, squareSize: -1 } })).toThrow(/welcome/)
    expect(() => parseSwatchLook({ welcome: { ...good, gap: 'big' } })).toThrow(/welcome/)
  })
})
