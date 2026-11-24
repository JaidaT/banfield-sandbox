import lookJson from '@/data/quick-quiz/swatch-cards.json'
import { isRecord } from './load'

// The swatch cards' look settings (data/quick-quiz/swatch-cards.json).
// strip: the colour of the strip holding the question. "yellow" is the brand
// yellow with dark text; "navy" is the brand navy with off-white text
// (Jaida, 2026-11-22).
// embedMinHeight: inside the website's iframe, the quiz is at least this tall
// (in pixels, on a phone and on a computer), so the iframe does not grow and
// shrink with every card. null: the iframe fits each card (Jaida, 2026-11-22).
// roomWidth: how wide the room above the bar is, as a percentage of the bar's
// width, on a phone and on a computer (Jaida, 2026-11-23). Left out: 25% and
// 40%, the first sizes.
// welcome: the moving columns of mascot squares behind the welcome card
// (docs/WELCOME_MASCOTS_PLAN.md, Jaida, 2026-11-23): the pictures (files in
// public/), how many seconds a square takes to move its own height, and the
// square size and gap in pixels, and whether the columns move ("animate",
// left out: true; false keeps the squares still). Left out: no background.
export type StripColour = 'yellow' | 'navy'
const STRIPS: StripColour[] = ['yellow', 'navy']

export interface EmbedMinHeight {
  phone: number
  computer: number
}

export interface RoomWidth {
  phone: number
  computer: number
}

export interface WelcomeLook {
  pictures: string[]
  secondsPerSquare: number
  squareSize: number
  gap: number
  animate: boolean
}

export interface SwatchLook {
  strip: StripColour
  embedMinHeight: EmbedMinHeight | null
  roomWidth: RoomWidth
  welcome: WelcomeLook | null
}

function parseWelcome(raw: unknown): WelcomeLook | null {
  if (raw === undefined || raw === null) return null
  const value = isRecord(raw) ? raw : {}
  const positive = (n: unknown): n is number => typeof n === 'number' && n > 0
  const pictures = value.pictures
  const picturesOk = Array.isArray(pictures) && pictures.length > 0 && pictures.every((p) => typeof p === 'string' && p.startsWith('/'))
  if (!picturesOk || !positive(value.secondsPerSquare) || !positive(value.squareSize) || !positive(value.gap)) {
    throw new Error(
      'swatch cards "welcome" must be { "pictures": ["/file.svg", ...], "secondsPerSquare": <seconds>, "squareSize": <pixels>, "gap": <pixels> }, with at least one picture and every number above 0',
    )
  }
  const animate = value.animate ?? true
  if (typeof animate !== 'boolean') throw new Error('swatch cards "welcome.animate" must be true or false')
  return { pictures: pictures as string[], secondsPerSquare: value.secondsPerSquare, squareSize: value.squareSize, gap: value.gap, animate }
}

function parseRoomWidth(raw: unknown): RoomWidth {
  if (raw === undefined) return { phone: 25, computer: 40 }
  const value = isRecord(raw) ? raw : {}
  const ok = (n: unknown): n is number => typeof n === 'number' && n > 0 && n <= 100
  if (!ok(value.phone) || !ok(value.computer)) {
    throw new Error('swatch cards "roomWidth" must be { "phone": <percent>, "computer": <percent> }, each from 1 to 100')
  }
  return { phone: value.phone, computer: value.computer }
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
  return {
    strip: strip as StripColour,
    embedMinHeight: parseEmbedMinHeight(settings.embedMinHeight),
    roomWidth: parseRoomWidth(settings.roomWidth),
    welcome: parseWelcome(settings.welcome),
  }
}

export function loadSwatchLook(): SwatchLook {
  return parseSwatchLook(lookJson as unknown)
}
