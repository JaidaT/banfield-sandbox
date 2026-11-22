import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import buildJson from '@/data/quick-quiz/room-build.json'
import { loadQuestions } from '@/lib/quick-quiz/load'
import { loadRoomBuild, parseRoomBuild } from '@/lib/quick-quiz/roomBuild'

// The room that builds (docs/ROOM_BUILD_PLAN.md, 2026-11-21).
const screenCount = loadQuestions().length + 1 // the questions, then contact
const raw = buildJson as unknown as Record<string, unknown> & { pieces: Record<string, unknown>[] }
const viewBox = (file: string) => readFileSync(join(process.cwd(), 'public', file), 'utf8').match(/viewBox="([^"]+)"/)?.[1]

describe('room-build.json (the real file)', () => {
  test('lists the 13 pieces in the plan order, one per screen', () => {
    const build = loadRoomBuild()
    expect(build.pieces.map((p) => p.name)).toEqual([
      'Rug',
      'Big shelf',
      'Floor lamp',
      'TV stand',
      'Wall shelves',
      'Chair',
      'Pictures',
      'Coffee table',
      'TV',
      'Clock',
      'Loveseat',
      'Things on the shelves',
      'Plants',
    ])
    expect(build.pieces).toHaveLength(screenCount)
  })

  test('every file exists and has the same artboard as the base', () => {
    const build = loadRoomBuild()
    const base = viewBox(build.base)
    expect(base).toBe('0 0 600 450')
    for (const file of [...build.pieces.map((p) => p.file), build.fullPicture]) expect(viewBox(file), file).toBe(base)
  })

  test('every centre point is inside the room', () => {
    for (const p of loadRoomBuild().pieces) {
      for (const value of [p.centreX, p.centreY]) {
        expect(value, p.name).toBeGreaterThanOrEqual(0)
        expect(value, p.name).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('parseRoomBuild', () => {
  const parse = (change: Record<string, unknown>) => () => parseRoomBuild({ ...raw, ...change }, screenCount)

  test('throws when there is not one piece per screen', () => {
    expect(parse({ pieces: raw.pieces.slice(1) })).toThrow(/13 pieces.*12/)
  })

  test('throws when a piece is listed twice', () => {
    expect(parse({ pieces: [...raw.pieces.slice(0, -1), raw.pieces[0]] })).toThrow(/01-rug.*more than once/)
  })

  test('throws when a centre point is outside the room', () => {
    const pieces = raw.pieces.map((p, i) => (i === 2 ? { ...p, centreX: 140 } : p))
    expect(parse({ pieces })).toThrow(/Floor lamp.*centre/)
  })

  test('throws when the base or a piece file is missing', () => {
    expect(parse({ base: '' })).toThrow(/base/)
    const pieces = raw.pieces.map((p, i) => (i === 0 ? { ...p, file: '' } : p))
    expect(parse({ pieces })).toThrow(/piece 0.*file/)
  })
})
