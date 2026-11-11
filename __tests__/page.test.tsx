import { afterEach, expect, test } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import Page from '../app/page'

afterEach(cleanup)

const box = (name: string) => within(screen.getByRole('region', { name }))

test('the home page is about the whole prototype, not only the Quick Quiz', () => {
  render(<Page />)
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Banfield Design Co. - prototype')
  expect(screen.queryByText(/not built yet/)).toBeNull()
})

test('a Quick Quiz box: try it, or view its sample briefs', () => {
  render(<Page />)
  const quiz = box('Quick Quiz')
  expect(quiz.getByRole('link', { name: 'Try the Quick Quiz' }).getAttribute('href')).toBe('/quiz')
  expect(quiz.getByRole('link', { name: 'View Quick Quiz sample briefs' }).getAttribute('href')).toBe('/team/quick-quiz')
})

test('a long questionnaire box: try it, or view its sample briefs', () => {
  render(<Page />)
  const long = box('Long questionnaire')
  expect(long.getByRole('link', { name: 'Try the Long Questionnaire' }).getAttribute('href')).toBe('/questionnaire')
  expect(long.getByRole('link', { name: 'View Long Questionnaire sample briefs' }).getAttribute('href')).toBe(
    '/team/long-questionnaire',
  )
})
