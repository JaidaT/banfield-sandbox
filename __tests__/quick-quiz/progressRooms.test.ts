import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import roomsJson from '@/data/quick-quiz/progress-rooms.json'
import { loadQuestions } from '@/lib/quick-quiz/load'
import { loadProgressRooms, parseProgressRooms } from '@/lib/quick-quiz/progressRooms'

// Room progress bar (docs/ROOM_PROGRESS_PLAN.md, 2026-11-21): which room sits
// on the progress bar on each Quick Quiz screen.
const screenIds = [...loadQuestions().map((q) => q.id), 'contact']
const raw = roomsJson as unknown as Record<string, unknown> & { screens: Record<string, string>; rooms: Record<string, unknown> }

describe('progress-rooms.json (the real file)', () => {
  test('pairs every screen with the room from the plan', () => {
    const rooms = loadProgressRooms()
    expect(Object.fromEntries(screenIds.map((id) => [id, rooms.screens[id].file]))).toEqual({
      decision_style: '/rooms/study-desk.svg',
      involvement: '/rooms/writing-desk.svg',
      different_concept: '/rooms/sitting-room.svg',
      confidence: '/rooms/reading-chair.svg',
      coffee: '/rooms/kitchen.svg',
      home_meaning: '/rooms/living-sofa.svg',
      project_scope: '/rooms/dining-table.svg',
      timeframe: '/rooms/window-sofa.svg',
      investment: '/rooms/home-office.svg',
      readiness: '/rooms/armchair.svg',
      service: '/rooms/vanity.svg',
      anything_else: '/rooms/reading-nook.svg',
      contact: '/rooms/bedroom.svg',
    })
  })

  test('the finished home on the result is the living room, dining table and bedroom', () => {
    expect(loadProgressRooms().finishedHome.map((r) => r.file)).toEqual(['/rooms/living-sofa.svg', '/rooms/dining-table.svg', '/rooms/bedroom.svg'])
  })

  test('every room file exists, with a shape to size it by', () => {
    for (const room of Object.values(loadProgressRooms().screens)) {
      expect(existsSync(join(process.cwd(), 'public', room.file)), room.file).toBe(true)
      expect(room.width, room.file).toBeGreaterThan(0)
      expect(room.height, room.file).toBeGreaterThan(0)
    }
  })
})

describe('placement: where the room sits (2026-11-21)', () => {
  test('the real file uses the middle version (2026-11-21)', () => {
    expect(loadProgressRooms().placement).toBe('middle')
  })

  test('accepts "follow-fill", "far-right" and "middle", and defaults to "follow-fill"', () => {
    for (const placement of ['follow-fill', 'far-right', 'middle']) {
      expect(parseProgressRooms({ ...raw, placement }, screenIds).placement).toBe(placement)
    }
    const { placement: _unused, ...noPlacement } = raw
    void _unused
    expect(parseProgressRooms(noPlacement, screenIds).placement).toBe('follow-fill')
  })

  test('throws on any other placement', () => {
    expect(() => parseProgressRooms({ ...raw, placement: 'top-left' }, screenIds)).toThrow(/placement.*top-left/)
  })
})

describe('parseProgressRooms', () => {
  const parse = (change: Record<string, unknown>) => () => parseProgressRooms({ ...raw, ...change }, screenIds)

  test('throws when a screen has no room', () => {
    const screens = { ...raw.screens }
    delete screens.coffee
    expect(parse({ screens })).toThrow(/coffee.*no room/)
  })

  test('throws on an unknown screen id', () => {
    expect(parse({ screens: { ...raw.screens, mystery: 'kitchen' } })).toThrow(/unknown screen.*mystery/)
  })

  test('throws when a screen names a room that is not in the list', () => {
    expect(parse({ screens: { ...raw.screens, coffee: 'garage' } })).toThrow(/coffee.*garage/)
  })

  test('throws when two screens share a room', () => {
    expect(parse({ screens: { ...raw.screens, coffee: 'bedroom' } })).toThrow(/bedroom.*more than one screen/)
  })

  test('throws on a room with no file or no shape', () => {
    expect(parse({ rooms: { ...raw.rooms, kitchen: { file: '/rooms/kitchen.svg', width: 0, height: 10 } } })).toThrow(/kitchen.*width/)
    expect(parse({ rooms: { ...raw.rooms, kitchen: { width: 10, height: 10 } } })).toThrow(/kitchen.*file/)
  })

  test('throws when the finished home names an unknown room', () => {
    expect(parse({ finishedHome: ['living-sofa', 'garage'] })).toThrow(/finished home.*garage/)
  })
})
