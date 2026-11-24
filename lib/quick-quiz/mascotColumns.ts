// The moving mascot columns behind the welcome card
// (docs/WELCOME_MASCOTS_PLAN.md, Jaida, 2026-11-23).

// Enough columns to fill a wide computer screen; odd, so one sits in the
// middle, behind the card. Columns past the screen's edges are cut off.
export const COLUMN_COUNT = 15

// Each loop is at least this tall, so a column always covers the screen
// (the iframe is 960px tall on a computer).
export const LOOP_MIN_HEIGHT = 1600

export type Direction = 'up' | 'down'

// The middle column moves down; the others alternate up and down outwards.
export function columnDirection(index: number, count: number = COLUMN_COUNT): Direction {
  const distance = Math.abs(index - (count - 1) / 2)
  return distance % 2 === 0 ? 'down' : 'up'
}

// How many squares one loop holds: whole rounds of the pictures, at least
// minHeight tall. step is a square plus its gap, in pixels.
export function squaresPerLoop(pictureCount: number, step: number, minHeight: number = LOOP_MIN_HEIGHT): number {
  const rounds = Math.max(1, Math.ceil(minHeight / step / pictureCount))
  return rounds * pictureCount
}

// The pictures down one column: each in turn, the start moved on two for
// each column, so neighbouring squares differ.
export function columnPictures(pictures: string[], index: number, count: number): string[] {
  const n = pictures.length
  const start = (2 * index) % n
  return Array.from({ length: count }, (_, i) => pictures[(start + i) % n])
}
