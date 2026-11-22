import roomsJson from '@/data/quick-quiz/progress-rooms.json'
import { isRecord, loadQuestions } from './load'

// Room progress bar (docs/ROOM_PROGRESS_PLAN.md, 2026-11-21): which room
// graphic sits on the Quick Quiz progress bar on each screen.

export interface Room {
  // Path from public/, e.g. "/rooms/kitchen.svg".
  file: string
  // The graphic's shape, from its viewBox, so it can show at one height.
  width: number
  height: number
}

// Where the room sits on the bar: its right edge following the end of the
// fill (version 1), always at the far right end (version 2), always in the
// middle of the bar (version 3), or a shorter bar beside one room that builds
// up piece by piece (version 4, docs/ROOM_BUILD_PLAN.md), that room centred
// above a full-width bar (version 5), or that room above a full-width bar
// with its right edge following the fill (version 6).
export type Placement = 'follow-fill' | 'far-right' | 'middle' | 'build-up' | 'build-up-middle' | 'build-up-follow'
const PLACEMENTS: Placement[] = ['follow-fill', 'far-right', 'middle', 'build-up', 'build-up-middle', 'build-up-follow']
// The versions with the room that builds.
export type BuildUpPlacement = 'build-up' | 'build-up-middle' | 'build-up-follow'
export const isBuildUp = (placement: Placement): placement is BuildUpPlacement => placement.startsWith('build-up')

export interface ProgressRooms {
  placement: Placement
  // Keyed by screen id: each quiz question id, then "contact".
  screens: Record<string, Room>
  // The rooms on the result's 100% bar.
  finishedHome: Room[]
}

function parseRoom(id: string, value: unknown): Room {
  const room = isRecord(value) ? value : {}
  if (typeof room.file !== 'string' || room.file === '') throw new Error(`room ${id} has no "file"`)
  for (const side of ['width', 'height'] as const) {
    if (typeof room[side] !== 'number' || !(room[side] > 0)) throw new Error(`room ${id} needs a "${side}" above 0`)
  }
  return { file: room.file, width: room.width as number, height: room.height as number }
}

// Checks every screen has its own room, and every name used is a known room.
export function parseProgressRooms(raw: unknown, screenIds: string[]): ProgressRooms {
  if (!isRecord(raw) || !isRecord(raw.rooms) || !isRecord(raw.screens)) {
    throw new Error('progress rooms need "rooms" and "screens"')
  }
  const rooms = new Map(Object.entries(raw.rooms).map(([id, value]) => [id, parseRoom(id, value)]))
  const roomFor = (name: unknown, where: string) => {
    const room = typeof name === 'string' ? rooms.get(name) : undefined
    if (!room) throw new Error(`${where} names a room that is not in the list: ${String(name)}`)
    return room
  }

  const known = new Set(screenIds)
  for (const id of Object.keys(raw.screens)) {
    if (!known.has(id)) throw new Error(`progress rooms list an unknown screen: ${id}`)
  }
  const used = new Set<unknown>()
  const screens: Record<string, Room> = {}
  for (const id of screenIds) {
    const name = raw.screens[id]
    if (name === undefined) throw new Error(`screen ${id} has no room`)
    if (used.has(name)) throw new Error(`room ${String(name)} is on more than one screen`)
    used.add(name)
    screens[id] = roomFor(name, `screen ${id}`)
  }

  const placement = raw.placement ?? 'follow-fill'
  if (!PLACEMENTS.includes(placement as Placement)) {
    throw new Error(`progress rooms "placement" must be one of ${PLACEMENTS.join(', ')}, not ${String(placement)}`)
  }

  const finishedHome = (Array.isArray(raw.finishedHome) ? raw.finishedHome : []).map((name) => roomFor(name, 'the finished home'))
  return { placement: placement as Placement, screens, finishedHome }
}

export function loadProgressRooms(): ProgressRooms {
  return parseProgressRooms(roomsJson as unknown, [...loadQuestions().map((q) => q.id), 'contact'])
}
