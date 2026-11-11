import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import LongQuestionnaireList from '@/app/team/long-questionnaire/page'
import HouseholdPage, { generateStaticParams } from '@/app/team/long-questionnaire/[id]/page'
import { longQuestionnaireRows } from '@/lib/long-questionnaire/sampleList'

afterEach(cleanup)

const pageFor = (id: string) => HouseholdPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({}) })
const rows = () => within(screen.getByRole('list', { name: 'Long questionnaire results' })).getAllByRole('listitem')
const rowFor = (name: string) => within(rows().find((r) => within(r).queryByRole('heading', { name }))!)

describe('the long questionnaire sample list (/team/long-questionnaire)', () => {
  test('one row per household, newest first, each headed with the name', () => {
    render(<LongQuestionnaireList />)
    const headings = rows().map((r) => within(r).getByRole('heading', { level: 2 }).textContent)
    expect(headings).toEqual(longQuestionnaireRows().map((r) => r.name))
    expect(headings[0]).toBe('Maya and Sam Example')
  })

  test('a row shows the date, project type and steps skipped', () => {
    render(<LongQuestionnaireList />)
    const row = rowFor('Ruth and Alan Example')
    expect(row.getByText('Nov 6, 2026')).toBeDefined()
    expect(row.getByText('Furniture and styling')).toBeDefined()
    expect(row.getByText('Steps skipped: Kids, Pets')).toBeDefined()
  })

  test('each row links to its full result', () => {
    render(<LongQuestionnaireList />)
    expect(
      rowFor('Ruth and Alan Example').getByRole('link', { name: 'Full result: Ruth and Alan Example' }).getAttribute('href'),
    ).toBe('/team/long-questionnaire/furniture_couple')
  })

  test('the label and test note are shown, the note marked as prototype only', () => {
    render(<LongQuestionnaireList />)
    const row = rowFor('Ruth and Alan Example')
    expect(row.getByText('Furniture and styling couple')).toBeDefined()
    expect(row.getByText(/^Test note \(prototype only\): .*Should skip Kids and Pets/)).toBeDefined()
  })

  test('links to the questionnaire itself', () => {
    render(<LongQuestionnaireList />)
    expect(screen.getByRole('link', { name: 'Try the Long Questionnaire' }).getAttribute('href')).toBe('/questionnaire')
  })
})

describe('one household (/team/long-questionnaire/<id>)', () => {
  test('there is a page for each of the 4 sample households', () => {
    expect(generateStaticParams()).toEqual([
      { id: 'growing_family' },
      { id: 'furniture_couple' },
      { id: 'solo_new_build' },
      { id: 'multi_generational' },
    ])
  })

  test("shows the household's name, its test note and skipped steps, with a link back to the list", async () => {
    render(await pageFor('furniture_couple'))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Ruth and Alan Example')
    expect(screen.getByText(/Test note \(prototype only\): .*Should skip Kids and Pets/)).toBeDefined()
    expect(screen.getByText('Steps skipped: Kids, Pets')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Copy as text' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Back to long questionnaire samples' }).getAttribute('href')).toBe(
      '/team/long-questionnaire',
    )
  })

  test('an unknown household is a "not found" page', async () => {
    await expect(pageFor('castle')).rejects.toThrow()
  })
})
