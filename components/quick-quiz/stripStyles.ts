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
