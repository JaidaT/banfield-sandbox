import { afterEach, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import TeamIndex from '@/app/team/page'

afterEach(cleanup)

test('/team links to each product\'s sample list', () => {
  render(<TeamIndex />)
  expect(screen.getByRole('link', { name: 'Quick Quiz sample briefs' }).getAttribute('href')).toBe('/team/quick-quiz')
  expect(screen.getByRole('link', { name: 'Long questionnaire sample briefs' }).getAttribute('href')).toBe(
    '/team/long-questionnaire',
  )
})

test('/team lists no samples itself', () => {
  render(<TeamIndex />)
  expect(screen.queryByRole('listitem')).toBeNull()
  expect(screen.queryByText(/Intended:|Test note/)).toBeNull()
})
