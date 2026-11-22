import lookJson from '@/data/quick-quiz/swatch-cards.json'
import { isRecord } from './load'

// The swatch cards' look settings (data/quick-quiz/swatch-cards.json).
// strip: the colour of the strip holding the question. "yellow" is the brand
// yellow with dark text; "navy" is the brand navy with off-white text
// (Jaida, 2026-11-22).
export type StripColour = 'yellow' | 'navy'
const STRIPS: StripColour[] = ['yellow', 'navy']

export interface SwatchLook {
  strip: StripColour
}

export function parseSwatchLook(raw: unknown): SwatchLook {
  const strip = (isRecord(raw) ? raw.strip : undefined) ?? 'yellow'
  if (!STRIPS.includes(strip as StripColour)) {
    throw new Error(`swatch cards "strip" must be one of ${STRIPS.join(', ')}, not ${String(strip)}`)
  }
  return { strip: strip as StripColour }
}

export function loadSwatchLook(): SwatchLook {
  return parseSwatchLook(lookJson as unknown)
}
