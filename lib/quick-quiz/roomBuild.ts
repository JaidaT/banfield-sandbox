import buildJson from '@/data/quick-quiz/room-build.json'
import { isRecord, loadQuestions } from './load'

// The room that builds (docs/ROOM_BUILD_PLAN.md, 2026-11-21): an empty room
// plus one piece per finished Quick Quiz screen.

export interface RoomPiece {
  name: string
  // Path from public/, e.g. "/room-assets/01-rug.svg".
  file: string
  // The middle of the drawing, as a percentage of the room: it grows from here.
  centreX: number
  centreY: number
}

export interface RoomBuild {
  // The artboard every file shares, so the pieces stack exactly.
  width: number
  height: number
  base: string
  pieces: RoomPiece[]
  fullPicture: string
}

const text = (value: unknown, where: string): string => {
  if (typeof value !== 'string' || value === '') throw new Error(`room build ${where} is missing`)
  return value
}

// Checks there is one piece per screen, no piece twice, and every centre is in the room.
export function parseRoomBuild(raw: unknown, screenCount: number): RoomBuild {
  if (!isRecord(raw) || !Array.isArray(raw.pieces)) throw new Error('room build needs a "pieces" list')
  const size = (side: 'width' | 'height') => {
    const value = raw[side]
    if (typeof value !== 'number' || !(value > 0)) throw new Error(`room build needs a "${side}" above 0`)
    return value
  }
  if (raw.pieces.length !== screenCount) {
    throw new Error(`room build needs ${screenCount} pieces (one per screen), not ${raw.pieces.length}`)
  }
  const seen = new Set<string>()
  const pieces = raw.pieces.map((entry: unknown, index): RoomPiece => {
    const piece = isRecord(entry) ? entry : {}
    const file = text(piece.file, `piece ${index} "file"`)
    if (seen.has(file)) throw new Error(`room build lists ${file} more than once`)
    seen.add(file)
    const name = text(piece.name, `piece ${index} "name"`)
    for (const axis of ['centreX', 'centreY'] as const) {
      const value = piece[axis]
      if (typeof value !== 'number' || value < 0 || value > 100) {
        throw new Error(`room build piece ${name}: its centre (${axis}) must be inside the room (0 to 100)`)
      }
    }
    return { name, file, centreX: piece.centreX as number, centreY: piece.centreY as number }
  })
  return { width: size('width'), height: size('height'), base: text(raw.base, '"base"'), pieces, fullPicture: text(raw.fullPicture, '"fullPicture"') }
}

export function loadRoomBuild(): RoomBuild {
  return parseRoomBuild(buildJson as unknown, loadQuestions().length + 1)
}
