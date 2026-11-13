import { Suspense } from 'react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import QuickQuizList from '@/app/team/quick-quiz/page'
import BriefPage, { BriefContent, generateStaticParams } from '@/app/team/quick-quiz/[id]/page'

afterEach(cleanup)

const params = (id: string) => Promise.resolve({ id })
// The part inside the page's Suspense boundary, which reads the address.
const briefFor = (id: string) => BriefContent({ params: params(id) })
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

  // Close calls show only inside the brief, not on the list (Jaida, 2026-11-13).
  test('the list shows no close-call marker, even for the tied sample', () => {
    render(<QuickQuizList />)
    expect(rowFor('Sam Patel').queryByText('Close call')).toBeNull()
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

  test('the page shows "Loading..." while it reads the address, so clicks from the list stay fast', () => {
    const page = BriefPage({ params: params('skipper'), searchParams: Promise.resolve({}) }) as ReactElement<{
      fallback: ReactElement
    }>
    expect(page.type).toBe(Suspense)
    render(page.props.fallback)
    expect(screen.getByText('Loading...')).toBeDefined()
  })
})
