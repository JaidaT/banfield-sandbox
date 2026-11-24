import type { CSSProperties } from 'react'
import { loadSwatchLook } from '@/lib/quick-quiz/swatchLook'
import type { StripColour } from '@/lib/quick-quiz/swatchLook'

// The swatch card strip's colours, from data/quick-quiz/swatch-cards.json.
// Kept out of the screen files, so a screen file only shares screens.
export const STRIP_COLOUR: StripColour = loadSwatchLook().strip

const STYLES: Record<StripColour, { strip: string; question: string; help: string }> = {
  yellow: { strip: 'bg-accent', question: 'text-charcoal', help: 'text-navy' },
  navy: { strip: 'bg-navy', question: 'text-frost', help: 'text-frost/85' },
}
export const STRIP = STYLES[STRIP_COLOUR]

// The room above the bar: as wide as the roomWidth setting (a share of the
// bar's width) on a phone and on a computer, centred (Jaida, 2026-11-23).
const ROOM_WIDTH = loadSwatchLook().roomWidth
export const ROOM_BOX = {
  className: 'w-[var(--room-w-phone)] sm:w-[var(--room-w-computer)]',
  style: { '--room-w-phone': `${ROOM_WIDTH.phone}%`, '--room-w-computer': `${ROOM_WIDTH.computer}%` } as CSSProperties,
}
