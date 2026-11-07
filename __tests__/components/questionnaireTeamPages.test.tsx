import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import TeamIndex from '@/app/team/page'
import HouseholdPage, { generateStaticParams } from '@/app/team/questionnaire/[id]/page'

afterEach(cleanup)

const pageFor = (id: string) => HouseholdPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({}) })

describe('team questionnaire pages', () => {
  test('there is a page for each of the 4 sample households', () => {
    expect(generateStaticParams()).toEqual([
      { id: 'growing_family' },
      { id: 'furniture_couple' },
      { id: 'solo_new_build' },
      { id: 'multi_generational' },
    ])
  })

  test("a household's page shows its name, what it should test, and its skipped steps", async () => {
    render(await pageFor('furniture_couple'))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Ruth and Alan Example')
    expect(screen.getByText(/Should skip Kids and Pets/)).toBeDefined()
    expect(screen.getByText('Steps skipped: Kids, Pets')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Copy as text' })).toBeDefined()
  })

  test('an unknown household is a "not found" page', async () => {
    await expect(pageFor('castle')).rejects.toThrow()
  })

  test('the team page links to each household and to the questionnaire', () => {
    render(<TeamIndex />)
    expect(screen.getByRole('link', { name: 'Furniture and styling couple' }).getAttribute('href')).toBe(
      '/team/questionnaire/furniture_couple',
    )
    expect(screen.getByRole('link', { name: 'Try the full questionnaire' }).getAttribute('href')).toBe('/questionnaire')
  })
})
