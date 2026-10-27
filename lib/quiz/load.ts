import archetypesJson from '@/data/archetypes.json'
import type { Archetype, ArchetypeData } from './types'

const STRING_FIELDS = ['id', 'label', 'communication', 'pacing', 'pitch'] as const
const ARRAY_FIELDS = ['segments', 'signals', 'risks'] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Validates untrusted JSON so a bad edit to the data file fails loudly
// instead of producing a brief with missing guidance.
export function parseArchetypes(raw: unknown): Archetype[] {
  if (!isRecord(raw) || !Array.isArray(raw.archetypes) || !isRecord(raw.segments)) {
    throw new Error('archetypes data must have an "archetypes" array and a "segments" object')
  }
  const segments = raw.segments
  const seen = new Set<string>()

  return raw.archetypes.map((entry: unknown, index: number): Archetype => {
    if (!isRecord(entry)) throw new Error(`archetype at index ${index} is not an object`)
    const name = typeof entry.id === 'string' ? entry.id : `index ${index}`

    for (const field of STRING_FIELDS) {
      if (typeof entry[field] !== 'string' || entry[field] === '') {
        throw new Error(`archetype ${name} is missing "${field}"`)
      }
    }
    for (const field of ARRAY_FIELDS) {
      if (!Array.isArray(entry[field])) throw new Error(`archetype ${name} is missing "${field}"`)
    }
    if ((entry.risks as unknown[]).length === 0) {
      throw new Error(`archetype ${name} must list at least one risk`)
    }
    if (seen.has(name)) throw new Error(`duplicate archetype id: ${name}`)
    seen.add(name)

    for (const segment of entry.segments as unknown[]) {
      if (typeof segment !== 'string' || !(segment in segments)) {
        throw new Error(`archetype ${name} references unknown segment: ${String(segment)}`)
      }
    }

    return {
      id: name,
      label: entry.label as string,
      tagline: typeof entry.tagline === 'string' ? entry.tagline : '',
      description: typeof entry.description === 'string' ? entry.description : '',
      segments: entry.segments as string[],
      signals: entry.signals as string[],
      communication: entry.communication as string,
      pacing: entry.pacing as string,
      pitch: entry.pitch as string,
      risks: entry.risks as string[],
      brief_tips: typeof entry.brief_tips === 'string' ? entry.brief_tips : '',
    }
  })
}

export function loadArchetypes(): Archetype[] {
  return parseArchetypes(archetypesJson as unknown)
}

export function loadSegments(): ArchetypeData['segments'] {
  return (archetypesJson as unknown as ArchetypeData).segments
}
