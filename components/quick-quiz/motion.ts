// How long the room progress bar's moves last (docs/ROOM_PROGRESS_PLAN.md).
export const ROOM_MOVE_MS = 400
export const REDUCED_FADE_MS = 150

// The length of a move in this browser: the full motion, a short fade when the
// person asks for less motion, or 0 where the browser cannot say (on the
// server, and in tests), so moves finish straight away.
export function moveLength(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 0
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? REDUCED_FADE_MS : ROOM_MOVE_MS
}
