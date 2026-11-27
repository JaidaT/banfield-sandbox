import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import ClientResultView from '@/components/quick-quiz/ClientResultView'
import { buildClientResult } from '@/lib/quick-quiz/buildClientResult'
import { designDnaFor } from '@/lib/quick-quiz/designDna'
import designDnaJson from '@/data/quick-quiz/design-dna.json'
import { loadArchetypes, loadClientCopy, loadQuizData, loadSampleSubmissions, parseDesignDna } from '@/lib/quick-quiz/load'

// The mascot on the client result (Jaida, 2026-11-27, docs/WELCOME_MASCOTS_PLAN.md):
// each Design DNA profile has its mascot, shown centred at the top of the
// yellow Design DNA card, above "DESIGN DNA" and the profile name.

const data = loadQuizData()
const samples = loadSampleSubmissions()
const copy = loadClientCopy()
const resultOf = (id: string) => {
  const s = samples.find((x) => x.id === id)!
  return buildClientResult(s, copy, designDnaFor(s, data))
}
const raw = () => JSON.parse(JSON.stringify(designDnaJson)) as { profiles: Record<string, unknown>[] }

afterEach(cleanup)

describe('design-dna.json: each profile has its mascot', () => {
  test('the five profiles use the five mascots, and every file exists', () => {
    const byName = Object.fromEntries(data.designDna.profiles.map((p) => [p.name, p.mascot]))
    expect(byName).toEqual({
      'The Curator': { file: '/mascots/curator-capybara.svg', alt: 'Curator Capybara' },
      'The Explorer': { file: '/mascots/explorer-echidna.svg', alt: 'Explorer Echidna' },
      'The Nest Builder': { file: '/mascots/nest-builder-nene.svg', alt: 'Nest-builder Nene' },
      'The Strategist': { file: '/mascots/strategist-seal.svg', alt: 'Strategist Seal' },
      'The Visionary': { file: '/mascots/visionary-vole.svg', alt: 'Visionary Vole' },
    })
    for (const p of data.designDna.profiles) expect(existsSync(join(process.cwd(), 'public', p.mascot!.file)), p.name).toBe(true)
  })

  test('a mascot is optional; given, it needs a file in public/ and a plain description', () => {
    const without = raw()
    delete without.profiles[0].mascot
    expect(parseDesignDna(without, loadArchetypes()).profiles[0].mascot).toBeUndefined()
    const badFile = raw()
    badFile.profiles[0].mascot = { file: 'seal.svg', alt: 'Seal' }
    expect(() => parseDesignDna(badFile, loadArchetypes())).toThrow(/mascot/)
    const blankAlt = raw()
    blankAlt.profiles[0].mascot = { file: '/seal.svg', alt: '' }
    expect(() => parseDesignDna(blankAlt, loadArchetypes())).toThrow(/mascot/)
  })
})

describe('the result screen', () => {
  test('shows the mascot at the top of the Design DNA card, before the profile name', () => {
    render(<ClientResultView result={resultOf('analytical-validator')} />)
    const card = screen.getByRole('region', { name: 'The Strategist' })
    const mascot = within(card).getByRole('img', { name: 'Strategist Seal' })
    expect(mascot.getAttribute('src')).toBe('/mascots/strategist-seal.svg')
    expect(card.firstElementChild).toBe(mascot)
  })

  test('no mascot when the profile has none', () => {
    const result = resultOf('analytical-validator')
    render(<ClientResultView result={{ ...result, designDna: { ...result.designDna!, mascot: undefined } }} />)
    expect(within(screen.getByRole('region', { name: 'The Strategist' })).queryByRole('img')).toBeNull()
  })
})
