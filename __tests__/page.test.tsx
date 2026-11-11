import { afterEach, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import Page from '../app/page'

afterEach(cleanup)

test('home page renders a main heading and links to the sample briefs', () => {
  render(<Page />)
  expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
  expect(screen.getByRole('link', { name: /sample/i }).getAttribute('href')).toBe('/team')
})

test('home page links to the Quick Quiz, and no longer says the quiz is not built', () => {
  render(<Page />)
  expect(screen.getByRole('link', { name: 'Try the Quick Quiz' }).getAttribute('href')).toBe('/quiz')
  expect(screen.queryByText(/not built yet/)).toBeNull()
})
