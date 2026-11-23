import lookJson from '@/data/quick-quiz/swatch-cards.json'
import { isRecord } from './load'

// The swatch cards' look settings (data/quick-quiz/swatch-cards.json).
// strip: the colour of the strip holding the question. "yellow" is the brand
// yellow with dark text; "navy" is the brand navy with off-white text
// (Jaida, 2026-11-22).
// embedMinHeight: inside the website's iframe, the quiz is at least this tall
// (in pixels, on a phone and on a computer), so the iframe does not grow and
// shrink with every card. null: the iframe fits each card (Jaida, 2026-11-22).
export type StripColour = 'yellow' | 'navy'
const STRIPS: StripColour[] = ['yellow', 'navy']

export interface EmbedMinHeight {
  phone: number
  computer: number
}

export interface SwatchLook {
  strip: StripColour
  embedMinHeight: EmbedMinHeight | null
}

function parseEmbedMinHeight(raw: unknown): EmbedMinHeight | null {
  if (raw === undefined || raw === null) return null
  const value = isRecord(raw) ? raw : {}
  const ok = (n: unknown): n is number => typeof n === 'number' && n > 0
  if (!ok(value.phone) || !ok(value.computer)) {
    throw new Error('swatch cards "embedMinHeight" must be null, or { "phone": <pixels>, "computer": <pixels> } with both above 0')
  }
  return { phone: value.phone, computer: value.computer }
}

export function parseSwatchLook(raw: unknown): SwatchLook {
  const settings = isRecord(raw) ? raw : {}
  const strip = settings.strip ?? 'yellow'
  if (!STRIPS.includes(strip as StripColour)) {
    throw new Error(`swatch cards "strip" must be one of ${STRIPS.join(', ')}, not ${String(strip)}`)
  }
  return { strip: strip as StripColour, embedMinHeight: parseEmbedMinHeight(settings.embedMinHeight) }
}

export function loadSwatchLook(): SwatchLook {
  return parseSwatchLook(lookJson as unknown)
}
