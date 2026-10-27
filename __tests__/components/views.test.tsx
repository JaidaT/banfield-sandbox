import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import ClientResultView from '@/components/ClientResultView'
import CopyBriefButton from '@/components/CopyBriefButton'
import TeamBriefView from '@/components/TeamBriefView'
import { buildClientResult } from '@/lib/quiz/buildClientResult'
import { buildTeamBrief } from '@/lib/quiz/buildTeamBrief'
import { loadClientCopy, loadQuizData, loadSampleSubmissions } from '@/lib/quiz/load'

afterEach(cleanup)

const data = loadQuizData()
const samples = loadSampleSubmissions()
const sample = (id: string) => {
  const s = samples.find((x) => x.id === id)
  if (!s) throw new Error(`no sample ${id}`)
  return s
}

describe('TeamBriefView', () => {
  test('shows the headline, contact details and a copy button', () => {
    const brief = buildTeamBrief(sample('weak-fit-explorer'), data)
    render(<TeamBriefView brief={brief} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Riley Thompson')
    expect(screen.getByText(brief.headline)).toBeDefined()
    expect(screen.getByText('riley.thompson@example.com')).toBeDefined()
    expect(screen.getByRole('button', { name: /copy/i })).toBeDefined()
  })

  test('shows guidance for each highlighted type, the fit and its notes', () => {
    const brief = buildTeamBrief(sample('mixed-cautious-controller'), data)
    render(<TeamBriefView brief={brief} />)
    for (const h of brief.highlights) {
      expect(screen.getByText(h.communication)).toBeDefined()
    }
    expect(screen.getByTestId('fit-overall').textContent).toMatch(/possible/i)
  })

  test('shows red flag notes', () => {
    const brief = buildTeamBrief(sample('skipper'), data)
    render(<TeamBriefView brief={brief} />)
    expect(screen.getByText(brief.fit.redFlags[0].note)).toBeDefined()
  })
})

describe('CopyBriefButton', () => {
  test('copies the text and confirms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<CopyBriefButton text="hello brief" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy/i }))
    })
    expect(writeText).toHaveBeenCalledWith('hello brief')
    expect(screen.getByRole('button').textContent).toMatch(/copied/i)
  })
})

describe('ClientResultView', () => {
  const copy = loadClientCopy()

  test('shows the greeting, closing and a booking link with pre-filled details', () => {
    const result = buildClientResult(sample('decisive-delegator'), data.questions, copy)
    render(<ClientResultView result={result} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Alex')
    expect(screen.getByText(result.closing)).toBeDefined()
    const link = screen.getByRole('link', { name: result.cta.label })
    expect(link.getAttribute('href')).toBe(result.cta.href)
  })

  // The quiz is embedded in Squarespace with an iframe. Booking must leave the
  // frame and open in the whole browser tab, not squeezed inside the quiz box.
  test('the booking link opens in the full window, not inside the iframe', () => {
    const result = buildClientResult(sample('decisive-delegator'), data.questions, copy)
    render(<ClientResultView result={result} />)
    expect(screen.getByRole('link', { name: result.cta.label }).getAttribute('target')).toBe('_top')
  })

  // DISCOVERY P3 and P6: nothing team-facing on the client screen.
  test('never renders archetype labels or fit ratings', () => {
    for (const s of samples) {
      const { container, unmount } = render(
        <ClientResultView result={buildClientResult(s, data.questions, copy)} />,
      )
      const text = (container.textContent ?? '').toLowerCase()
      for (const a of data.archetypes) {
        expect(text, s.id).not.toContain(a.label.replace(/^The /, '').toLowerCase())
      }
      expect(text, s.id).not.toMatch(/\b(strong|weak|possible) fit\b|%/)
      unmount()
    }
  })
})
