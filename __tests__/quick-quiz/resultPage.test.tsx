import { Suspense } from 'react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import ResultPage, { ResultContent, generateStaticParams } from '@/app/result/[id]/page'

afterEach(cleanup)

const params = (id: string) => Promise.resolve({ id })

describe('one client result (/result/<id>)', () => {
  test('there is a page for each sample', () => {
    expect(generateStaticParams()).toHaveLength(6)
  })

  test("shows that sample's Design DNA, without the quiz's complete bar", async () => {
    render(await ResultContent({ params: params('decisive-delegator') }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe("You're all done!")
    expect(screen.getByRole('heading', { level: 2, name: 'The Visionary' })).toBeDefined()
    expect(screen.queryByText('Questionnaire complete')).toBeNull()
  })

  test('an unknown sample is a "not found" page', async () => {
    await expect(ResultContent({ params: params('castle') })).rejects.toThrow()
  })

  test('the page shows "Loading..." while it reads the address, so clicks from the list stay fast', () => {
    const page = ResultPage({ params: params('skipper'), searchParams: Promise.resolve({}) }) as ReactElement<{
      fallback: ReactElement
    }>
    expect(page.type).toBe(Suspense)
    render(page.props.fallback)
    expect(screen.getByText('Loading...')).toBeDefined()
  })
})
