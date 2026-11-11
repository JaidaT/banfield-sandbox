import { describe, expect, test } from 'vitest'
import { findCloseCalls } from '@/lib/quick-quiz/closeCalls'
import type { ArchetypeScore } from '@/lib/quick-quiz/types'

// Made-up scores, highest first, as scoreArchetypes returns them.
const NAMES = {
  D: 'The Decisive Delegator',
  A: 'The Analytical Validator',
  C: 'The Cautious Reassurance Seeker',
  R: 'The Creative Collaborator',
  H: 'The Hands-On Controller',
} as const
type Key = keyof typeof NAMES

function scores(...entries: [Key, number][]): ArchetypeScore[] {
  return entries.map(([key, percent]) => ({ id: key, label: NAMES[key], points: percent, percent }))
}

// The headline shows the top type, plus the second if it has 20% or more (at most two).
function shown(list: ArchetypeScore[]): string[] {
  return list.filter((s, i) => i === 0 || (i === 1 && s.percent >= 20)).map((s) => s.id)
}

const check = (list: ArchetypeScore[], points = 5) => findCloseCalls(list, shown(list), points)

describe('findCloseCalls', () => {
  test('a clear winner gets no note', () => {
    expect(check(scores(['D', 80], ['H', 13], ['A', 7], ['C', 0], ['R', 0]))).toEqual([])
  })

  test('an exact tie for the top names both, and says they could be either or a mix', () => {
    expect(check(scores(['D', 50], ['R', 50], ['A', 0], ['C', 0], ['H', 0]))).toEqual([
      'Close call: Decisive Delegator and Creative Collaborator are within 5 points of each other. They could be either, or a real mix of both.',
    ])
  })

  test('all five level names all five', () => {
    expect(check(scores(['D', 20], ['A', 20], ['C', 20], ['R', 20], ['H', 20]))).toEqual([
      'Close call: Decisive Delegator, Analytical Validator, Cautious Reassurance Seeker, Creative Collaborator and Hands-On Controller are within 5 points of each other. They could be any one of these, or a real mix.',
    ])
  })

  test('a near tie names every type within 5 points of the top, and no others', () => {
    expect(check(scores(['D', 34], ['A', 31], ['C', 30], ['R', 5], ['H', 0]))).toEqual([
      'Close call: Decisive Delegator, Analytical Validator and Cautious Reassurance Seeker are within 5 points of each other. They could be any one of these, or a real mix.',
    ])
  })

  test('exactly 5 points apart counts; 6 does not', () => {
    expect(check(scores(['D', 35], ['A', 30], ['C', 20], ['R', 15], ['H', 0]))).toHaveLength(1)
    expect(check(scores(['D', 34], ['A', 28], ['C', 20], ['R', 18], ['H', 0]))).toEqual([])
  })

  test('types left out of the headline but level with the second one are named', () => {
    expect(check(scores(['R', 40], ['D', 20], ['C', 20], ['H', 20], ['A', 0]))).toEqual([
      'Close call: Cautious Reassurance Seeker and Hands-On Controller scored within 5 points of Decisive Delegator but are not in the headline.',
    ])
  })

  test('one type left out reads in the singular', () => {
    expect(check(scores(['R', 50], ['D', 26], ['C', 24], ['H', 0], ['A', 0]))).toEqual([
      'Close call: Cautious Reassurance Seeker scored within 5 points of Decisive Delegator but is not in the headline.',
    ])
  })

  test('both notes can show, without naming a type twice', () => {
    // Top two within 5, and a third type left out within 5 of the second but 7 from the top.
    expect(check(scores(['D', 35], ['A', 32], ['C', 28], ['R', 5], ['H', 0]))).toEqual([
      'Close call: Decisive Delegator and Analytical Validator are within 5 points of each other. They could be either, or a real mix of both.',
      'Close call: Cautious Reassurance Seeker scored within 5 points of Analytical Validator but is not in the headline.',
    ])
  })

  test('left out because of the 20% cutoff, not a tie, gets no note', () => {
    expect(check(scores(['D', 80], ['H', 13], ['A', 7], ['C', 0], ['R', 0]))).toEqual([])
    expect(check(scores(['D', 70], ['H', 18], ['A', 12], ['C', 0], ['R', 0]))).toEqual([])
  })

  test('with the setting at 0, only exact ties count, and the wording says "the same"', () => {
    // 34 vs 33 is 1 point apart, so not a tie for the top; the 33s are level.
    expect(check(scores(['D', 34], ['A', 33], ['C', 33], ['R', 0], ['H', 0]), 0)).toEqual([
      'Close call: Cautious Reassurance Seeker scored the same as Analytical Validator but is not in the headline.',
    ])
    expect(check(scores(['D', 50], ['R', 50], ['A', 0], ['C', 0], ['H', 0]), 0)).toEqual([
      'Close call: Decisive Delegator and Creative Collaborator scored the same. They could be either, or a real mix of both.',
    ])
  })

  test('types with no points are never named', () => {
    expect(check(scores(['D', 100], ['A', 0], ['C', 0], ['R', 0], ['H', 0]), 100)).toEqual([])
  })

  test('no points at all ("not enough answers") gets no note', () => {
    expect(findCloseCalls(scores(['D', 0], ['A', 0], ['C', 0], ['R', 0], ['H', 0]), [], 5)).toEqual([])
  })
})
