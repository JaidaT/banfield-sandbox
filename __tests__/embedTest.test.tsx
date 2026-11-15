import { Children, Suspense, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import EmbedTestPage, { EmbedTestContent, EmbedTestView, metadata } from '@/app/embed-test/page'
import HomePage from '@/app/page'

// /embed-test: a stand-in website with the Quick Quiz in an iframe, to try the
// iframe fixes on a phone (DECISIONS.md 2026-11-15).
afterEach(cleanup)

const iframe = () => screen.getByTitle('Quick Quiz') as HTMLIFrameElement
// Whether the page asks for the embed script. Checked on what the page returns,
// because React adds a script to the document head only once per test run.
function loadsEmbedScript(fixesOn: boolean): boolean {
  const page = EmbedTestView({ fixesOn }) as ReactElement<{ children: ReactNode }>
  return Children.toArray(page.props.children).some(
    (child) => isValidElement<{ src?: string }>(child) && child.type === 'script' && child.props.src === '/quick-quiz-embed.js',
  )
}

describe('the embed test page', () => {
  test('says it is a test page and is hidden from search engines', () => {
    render(<EmbedTestView fixesOn />)
    expect(screen.getByText(/Test page/)).toBeDefined()
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  test('has a sticky header the script can find', () => {
    render(<EmbedTestView fixesOn />)
    const header = screen.getByRole('banner')
    expect(header.hasAttribute('data-sticky-header')).toBe(true)
    expect(header.className).toContain('sticky')
  })

  test('shows the quiz in an iframe with a title for screen readers', () => {
    render(<EmbedTestView fixesOn />)
    expect(iframe().getAttribute('src')).toBe('/quiz')
  })

  test('has page content after the quiz, so scrolling matters', () => {
    render(<EmbedTestView fixesOn />)
    expect(screen.getByRole('contentinfo')).toBeDefined()
  })

  test('fixes on: the iframe is marked for the script, the script loads, no fixed height', () => {
    render(<EmbedTestView fixesOn />)
    expect(iframe().hasAttribute('data-quick-quiz')).toBe(true)
    expect(iframe().style.height).toBe('')
    expect(loadsEmbedScript(true)).toBe(true)
  })

  test('fixes off: a fixed 600px iframe with its own scroll box, and no script', () => {
    render(<EmbedTestView fixesOn={false} />)
    expect(iframe().hasAttribute('data-quick-quiz')).toBe(false)
    expect(iframe().style.height).toBe('600px')
    expect(loadsEmbedScript(false)).toBe(false)
  })

  test('the switch says which version is showing and links to the other', () => {
    render(<EmbedTestView fixesOn />)
    expect(screen.getByRole('link', { name: 'Fixes on' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Fixes off' }).getAttribute('href')).toBe('/embed-test?fixes=off')
    cleanup()
    render(<EmbedTestView fixesOn={false} />)
    expect(screen.getByRole('link', { name: 'Fixes off' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Fixes on' }).getAttribute('href')).toBe('/embed-test')
  })
})

describe('reading the address', () => {
  test('no setting means fixes on', async () => {
    render(await EmbedTestContent({ searchParams: Promise.resolve({}) }))
    expect(iframe().hasAttribute('data-quick-quiz')).toBe(true)
  })

  test('?fixes=off means fixes off', async () => {
    render(await EmbedTestContent({ searchParams: Promise.resolve({ fixes: 'off' }) }))
    expect(iframe().hasAttribute('data-quick-quiz')).toBe(false)
  })

  test('the page reads the address inside Suspense', () => {
    const page = EmbedTestPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }) as ReactElement
    expect(page.type).toBe(Suspense)
  })
})

test('the home page does not link to the embed test page', () => {
  render(<HomePage />)
  const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
  expect(links.some((href) => href?.startsWith('/embed-test'))).toBe(false)
})
