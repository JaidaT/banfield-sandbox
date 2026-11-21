// How long the swatch cards' moves last (docs/SWATCH_CARDS_PLAN.md, timings).
export const CARD_MOVE_MS = 400
export const REDUCED_FADE_MS = 150
// The "Calculating your Design DNA" pause: always 2 seconds, motion or not.
export const CALCULATING_MS = 2000

// The length of a move in this browser: the full motion, a short fade when the
// person asks for less motion, or 0 where the browser cannot say (on the
// server, and in tests), so moves finish straight away.
export function moveLength(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 0
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? REDUCED_FADE_MS : CARD_MOVE_MS
}

// True when the person asks for less motion.
export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
