import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import QuickQuizList from '@/app/team/quick-quiz/page'
import BriefPage, { generateStaticParams } from '@/app/team/quick-quiz/[id]/page'

afterEach(cleanup)

const briefFor = (id: string) => BriefPage({ params: Promise.resolve({ id }), searchParams: Promise.resolve({}) })
const rows = () => within(screen.getByRole('list', { name: 'Quick Quiz results' })).getAllByRole('listitem')
const rowFor = (name: string) => within(rows().find((r) => within(r).queryByRole('heading', { name }))!)

describe('the Quick Quiz sample list (/team/quick-quiz)', () => {
  test('one row per sample, newest first, each headed with the name', () => {
    render(<QuickQuizList />)
    expect(rows().map((r) => within(r).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Sam Patel',
      'Alex Morgan',
      'Jordan Lee',
      'Casey Nguyen',
      'Riley Thompson',
      'Morgan Davis',
    ])
  })

  test('a row shows the date, the lead label and the client type', () => {
    render(<QuickQuizList />)
    const row = rowFor('Alex Morgan')
    expect(row.getByText('Nov 9, 2026')).toBeDefined()
    expect(row.getByText('Hot lead')).toBeDefined()
    expect(row.getByText('80% Decisive Delegator')).toBeDefined()
  })

  test('only the tied sample shows a close-call marker', () => {
    render(<QuickQuizList />)
    expect(rowFor('Sam Patel').getByText('Close call')).toBeDefined()
    expect(rowFor('Alex Morgan').queryByText('Close call')).toBeNull()
  })

  test('each row links to its brief and its client result', () => {
    render(<QuickQuizList />)
    const row = rowFor('Alex Morgan')
    expect(row.getByRole('link', { name: 'Brief: Alex Morgan' }).getAttribute('href')).toBe('/team/quick-quiz/decisive-delegator')
    expect(row.getByRole('link', { name: 'Client result: Alex Morgan' }).getAttribute('href')).toBe('/result/decisive-delegator')
  })

  test('the test note is labelled as prototype only', () => {
    render(<QuickQuizList />)
    expect(rowFor('Alex Morgan').getByText(/^Test note \(prototype only\):/)).toBeDefined()
  })
})

describe('one Quick Quiz brief (/team/quick-quiz/<id>)', () => {
  test('there is a page for each sample', () => {
    expect(generateStaticParams()).toHaveLength(6)
  })

  test('shows the brief, with a link back to the list', async () => {
    render(await briefFor('decisive-delegator'))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Alex Morgan')
    expect(screen.getByRole('link', { name: 'Back to Quick Quiz samples' }).getAttribute('href')).toBe('/team/quick-quiz')
  })

  test('an unknown sample is a "not found" page', async () => {
    await expect(briefFor('castle')).rejects.toThrow()
  })
})
