// The messages the Quick Quiz sends to the website page around its iframe
// (DECISIONS.md 2026-11-15). The page's script (public/quick-quiz-embed.js)
// uses them to size the iframe and scroll to the top of the quiz.
// They carry a height or "new screen" only: never answers or contact details.

// Marks the quiz's messages, so the page can ignore anyone else's.
export const EMBED_SOURCE = 'banfield-quick-quiz'

export type EmbedMessage =
  | { source: typeof EMBED_SOURCE; type: 'height'; height: number }
  | { source: typeof EMBED_SOURCE; type: 'new-screen' }

// "The quiz is this many pixels tall."
export function heightMessage(px: number): EmbedMessage {
  return { source: EMBED_SOURCE, type: 'height', height: Math.round(px) }
}

// "A new screen just showed" (after Next, Back or Submit).
export function newScreenMessage(): EmbedMessage {
  return { source: EMBED_SOURCE, type: 'new-screen' }
}

// Turns anything received into one of the two messages, or null if it is not
// one. Extra fields are dropped.
export function readEmbedMessage(data: unknown): EmbedMessage | null {
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  if (d.source !== EMBED_SOURCE) return null
  if (d.type === 'new-screen') return newScreenMessage()
  if (d.type === 'height' && typeof d.height === 'number' && Number.isFinite(d.height) && d.height >= 0) {
    return heightMessage(d.height)
  }
  return null
}
