import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import ClientResultView from '@/components/quick-quiz/ClientResultView'
import CopyBriefButton from '@/components/form/CopyBriefButton'
import TeamBriefView from '@/components/quick-quiz/TeamBriefView'
import { buildClientResult } from '@/lib/quick-quiz/buildClientResult'
import { buildTeamBrief } from '@/lib/quick-quiz/buildTeamBrief'
import { designDnaFor } from '@/lib/quick-quiz/designDna'
import { loadClientCopy, loadQuizData, loadSampleSubmissions } from '@/lib/quick-quiz/load'

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
    const brief = buildTeamBrief(sample('cold-explorer'), data)
    render(<TeamBriefView brief={brief} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Riley Thompson')
    expect(screen.getByText(brief.headline)).toBeDefined()
    expect(screen.getByText('riley.thompson@example.com')).toBeDefined()
    expect(screen.getByRole('button', { name: /copy/i })).toBeDefined()
  })

  test('a close call shows as a note under the headline', () => {
    const brief = buildTeamBrief(sample('out-of-area-hot'), data)
    render(<TeamBriefView brief={brief} />)
    const note = screen.getByRole('note', { name: 'Close call' })
    expect(note.textContent).toBe(brief.closeCalls[0])
    // Right after the headline, before the copy button.
    expect(screen.getByText(brief.headline).nextElementSibling).toBe(note)
  })

  test('a clear client type shows no close-call note', () => {
    render(<TeamBriefView brief={buildTeamBrief(sample('cold-explorer'), data)} />)
    expect(screen.queryByRole('note', { name: 'Close call' })).toBeNull()
  })

  test('says "Not given" for blank contact details', () => {
    const s = sample('cold-explorer')
    const blank = { ...s, contact: { name: '', email: '', phone: '', siteAddress: { street: '', city: '', postalCode: '' } } }
    render(<TeamBriefView brief={buildTeamBrief(blank, data)} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Name not given')
    expect(screen.getAllByText('Not given')).toHaveLength(3)
  })

  test('shows guidance for each highlighted type and the lead label', () => {
    const brief = buildTeamBrief(sample('mixed-cautious-controller'), data)
    render(<TeamBriefView brief={brief} />)
    for (const h of brief.highlights) {
      expect(screen.getByText(h.communication)).toBeDefined()
    }
    expect(screen.getByTestId('lead-temperature').textContent).toMatch(/warm lead/i)
  })

  // Oct 28 meeting: fit sits above the client type in the brief.
  test('the lead section comes before the client type section', () => {
    render(<TeamBriefView brief={buildTeamBrief(sample('skipper'), data)} />)
    const leadLabel = screen.getByTestId('lead-temperature')
    const clientType = screen.getByRole('heading', { name: 'Client type' })
    expect(leadLabel.compareDocumentPosition(clientType) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('shows warning sign notes', () => {
    const brief = buildTeamBrief(sample('skipper'), data)
    render(<TeamBriefView brief={brief} />)
    expect(screen.getByText(brief.lead.warningSigns[0].note)).toBeDefined()
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

  // Phones testing the dev server over Wi-Fi use plain http, where browsers
  // turn off navigator.clipboard. The button falls back to the older copy command.
  async function clickWithFallback(execResult: boolean | Error) {
    let copied = ''
    const execCommand = vi.fn(() => {
      if (execResult instanceof Error) throw execResult
      copied = document.querySelector('textarea')?.value ?? ''
      return execResult
    })
    Object.assign(document, { execCommand })
    render(<CopyBriefButton text="hello brief" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy/i }))
    })
    return { execCommand, copied }
  }

  test('falls back to the older copy command when the clipboard is unavailable', async () => {
    Object.assign(navigator, { clipboard: undefined })
    const { execCommand, copied } = await clickWithFallback(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(copied).toBe('hello brief')
    expect(screen.getByRole('button').textContent).toMatch(/copied/i)
    expect(document.querySelector('textarea')).toBeNull()
  })

  test('falls back when the clipboard refuses to copy', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) } })
    const { execCommand } = await clickWithFallback(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(screen.getByRole('button').textContent).toMatch(/copied/i)
  })

  test('says copy failed when both ways fail', async () => {
    Object.assign(navigator, { clipboard: undefined })
    await clickWithFallback(false)
    expect(screen.getByRole('button').textContent).toMatch(/failed/i)
  })

  test('says copy failed when the older copy command throws', async () => {
    Object.assign(navigator, { clipboard: undefined })
    await clickWithFallback(new Error('not supported'))
    expect(screen.getByRole('button').textContent).toMatch(/failed/i)
    expect(document.querySelector('textarea')).toBeNull()
  })
})

describe('ClientResultView', () => {
  const copy = loadClientCopy()
  const resultOf = (id: string) => buildClientResult(sample(id), copy, designDnaFor(sample(id), data))
  const headings = () => screen.getAllByRole('heading').map((h) => h.textContent)

  test('follows the mockup: done, Design DNA, what happens next, thank you', () => {
    render(<ClientResultView result={resultOf('analytical-validator')} />)
    expect(headings()).toEqual(["You're all done!", 'The Strategist', 'What happens next', 'Thank you!'])
    expect(screen.getByText("Here's what your answers reveal about your design approach.")).toBeDefined()
    expect(screen.getByText('You may now exit this screen.')).toBeDefined()
  })

  test('the Design DNA card shows the label, headline, paragraph and secondary trait', () => {
    const result = resultOf('analytical-validator')
    render(<ClientResultView result={result} />)
    const card = screen.getByRole('region', { name: 'The Strategist' })
    expect(card.textContent).toContain('DESIGN DNA')
    expect(card.textContent).toContain('You feel most confident when every choice has a reason.')
    expect(card.textContent).toContain(result.designDna!.description)
    expect(card.textContent).toContain('SECONDARY TRAIT / The Curator')
  })

  test('no secondary trait line when there is none', () => {
    render(<ClientResultView result={resultOf('decisive-delegator')} />)
    expect(screen.getByRole('region', { name: 'The Visionary' }).textContent).not.toContain('SECONDARY TRAIT')
  })

  test('no Design DNA card when there were not enough answers; the rest still shows', () => {
    render(<ClientResultView result={{ ...resultOf('decisive-delegator'), designDna: null }} />)
    expect(screen.queryByText('DESIGN DNA')).toBeNull()
    expect(headings()).toEqual(["You're all done!", 'What happens next', 'Thank you!'])
  })

  test('the booking button pre-fills details and opens in the full window, not inside the iframe', () => {
    const result = resultOf('decisive-delegator')
    render(<ClientResultView result={result} />)
    const link = screen.getByRole('link', { name: 'Book your Meet + Inspire with Jamie' })
    expect(link.getAttribute('href')).toBe(result.cta.href)
    expect(link.getAttribute('target')).toBe('_top')
  })

  test('has no "Share my results" button yet', () => {
    render(<ClientResultView result={resultOf('decisive-delegator')} />)
    expect(screen.queryByRole('button', { name: /share/i })).toBeNull()
    expect(screen.queryByText(/share/i)).toBeNull()
  })

  test('the "Questionnaire complete 100%" bar shows only when asked for', () => {
    const { unmount } = render(<ClientResultView result={resultOf('decisive-delegator')} />)
    expect(screen.queryByText('Questionnaire complete')).toBeNull()
    unmount()
    render(<ClientResultView result={resultOf('decisive-delegator')} complete />)
    expect(screen.getByText('Questionnaire complete')).toBeDefined()
    expect(screen.getByText('100%')).toBeDefined()
  })

  // DISCOVERY P3 and P6: nothing team-facing on the client screen.
  test('never renders archetype labels or fit ratings', () => {
    for (const s of samples) {
      const { container, unmount } = render(<ClientResultView result={resultOf(s.id)} complete />)
      const text = (container.textContent ?? '').toLowerCase()
      for (const a of data.archetypes) {
        expect(text, s.id).not.toContain(a.label.replace(/^The /, '').toLowerCase())
      }
      // "100%" is the complete bar, not a score.
      expect(text.replace('100%', ''), s.id).not.toMatch(/\b(strong|weak|possible) fit\b|\b(hot|warm|cold) lead\b|%/)
      unmount()
    }
  })
})
