import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import MascotBackground from '@/components/quick-quiz/MascotBackground'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { COLUMN_COUNT, columnDirection, columnPictures, squaresPerLoop } from '@/lib/quick-quiz/mascotColumns'
import { loadClientCopy, loadQuizData, loadQuizForm } from '@/lib/quick-quiz/load'
import { loadSwatchLook } from '@/lib/quick-quiz/swatchLook'
import { quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'

// The moving mascot columns behind the welcome card (docs/WELCOME_MASCOTS_PLAN.md,
// Jaida, 2026-11-23): the middle column moves down, the others alternate up
// and down outwards from it; one square takes secondsPerSquare to move its
// own height; still with reduced motion.

const quizData = loadQuizData()
const look = loadSwatchLook().welcome!

function renderQuiz() {
  render(<QuizForm questionnaire={quizQuestionnaire(quizData.questions, loadQuizForm())} quizData={quizData} clientCopy={loadClientCopy()} />)
}
const background = () => screen.getByTestId('mascot-background')
const columns = () => Array.from(background().querySelectorAll<HTMLElement>('[data-direction]'))

afterEach(cleanup)

describe('the column rules', () => {
  test('an odd number of columns, so one is in the middle', () => {
    expect(COLUMN_COUNT % 2).toBe(1)
  })

  test('the middle column moves down; the others alternate outwards', () => {
    const middle = (COLUMN_COUNT - 1) / 2
    expect(columnDirection(middle)).toBe('down')
    expect(columnDirection(middle - 1)).toBe('up')
    expect(columnDirection(middle + 1)).toBe('up')
    expect(columnDirection(middle - 2)).toBe('down')
    expect(columnDirection(middle + 2)).toBe('down')
  })

  test('a loop is a whole number of picture rounds, at least as tall as asked', () => {
    // 5 pictures, 124px a square, at least 1600px: 13 squares, rounded up to 15.
    expect(squaresPerLoop(5, 124, 1600)).toBe(15)
    expect(squaresPerLoop(5, 400, 1600)).toBe(5)
  })

  test('each column uses the pictures in turn, starting at a different one', () => {
    const pictures = ['/a.svg', '/b.svg', '/c.svg']
    expect(columnPictures(pictures, 0, 4)).toEqual(['/a.svg', '/b.svg', '/c.svg', '/a.svg'])
    expect(columnPictures(pictures, 1, 3)).toEqual(['/c.svg', '/a.svg', '/b.svg'])
  })
})

describe('the background on the welcome screen', () => {
  test('is decoration only: hidden from screen readers, not clickable, nothing to Tab to', () => {
    renderQuiz()
    expect(background().getAttribute('aria-hidden')).toBe('true')
    expect(background().className).toContain('pointer-events-none')
    expect(background().querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0)
    for (const img of background().querySelectorAll('img')) expect(img.getAttribute('alt')).toBe('')
  })

  // Jaida, 2026-11-27: plain, no box; each picture fits its square without stretching.
  test('each picture fits inside its square without stretching, with no box around it', () => {
    renderQuiz()
    for (const img of background().querySelectorAll('img')) {
      expect(img.className).toContain('object-contain')
      expect(img.className).not.toMatch(/border|bg-/)
    }
  })

  test('has the columns, the middle one moving down and the rest alternating', () => {
    renderQuiz()
    expect(columns()).toHaveLength(COLUMN_COUNT)
    expect(columns().map((c) => c.dataset.direction)).toEqual(Array.from({ length: COLUMN_COUNT }, (_, i) => columnDirection(i)))
  })

  test('every other column is shifted down by half a square', () => {
    renderQuiz()
    const step = look.squareSize + look.gap
    const middle = (COLUMN_COUNT - 1) / 2
    expect(columns()[middle].style.marginTop).toBe('')
    expect(columns()[middle + 1].style.marginTop).toBe(`${-step / 2}px`)
  })

  test('one loop takes secondsPerSquare for every square in it, and repeats once so it is seamless', () => {
    renderQuiz()
    const loop = squaresPerLoop(look.pictures.length, look.squareSize + look.gap, 1600)
    const track = columns()[0].firstElementChild as HTMLElement
    expect(track.style.getPropertyValue('--loop')).toBe(`${loop * look.secondsPerSquare}s`)
    expect(track.querySelectorAll('img')).toHaveLength(loop * 2)
  })

  test('with "animate": true, every column moves', () => {
    renderQuiz()
    for (const column of columns()) expect((column.firstElementChild as HTMLElement).className).toMatch(/^mascot-(up|down)$/)
  })

  // Jaida, 2026-11-23: "animate": false keeps the squares but stops the movement.
  test('with "animate": false, the squares show but no column moves', () => {
    render(<MascotBackground look={{ ...look, animate: false }} />)
    expect(columns()).toHaveLength(COLUMN_COUNT)
    for (const column of columns()) expect((column.firstElementChild as HTMLElement).className).not.toMatch(/mascot-(up|down)/)
    expect(background().querySelectorAll('img').length).toBeGreaterThan(0)
  })

  // Jaida, 2026-11-27: only the columns fade; the logo on the card stays full strength.
  test('the columns show at the opacity setting (30%); the card logo does not fade', () => {
    renderQuiz()
    expect(background().style.opacity).toBe('0.3')
    const cardLogo = screen.getByTestId('welcome-card').querySelector('img')!
    expect(cardLogo.style.opacity).toBe('')
    expect(cardLogo.closest('[data-testid="mascot-background"]')).toBeNull()
  })

  test('goes away after "Get Started"', () => {
    renderQuiz()
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    expect(screen.queryByTestId('mascot-background')).toBeNull()
  })

  test('stands still with reduced motion (app/globals.css)', () => {
    const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.mascot-up,\s*\.mascot-down\s*\{\s*animation: none/)
  })
})
