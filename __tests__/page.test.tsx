import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from '../app/page'

test('home page renders a main heading and links to the sample briefs', () => {
  render(<Page />)
  expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
  expect(screen.getByRole('link', { name: /sample/i }).getAttribute('href')).toBe('/team')
})
