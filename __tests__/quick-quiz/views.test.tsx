import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import ClientResultView from '@/components/quick-quiz/ClientResultView'
import CopyBriefButton from '@/components/form/CopyBriefButton'
import TeamBriefView from '@/components/quick-quiz/TeamBriefView'
import { buildClientResult } from '@/lib/quick-quiz/buildClientResult'
import { buildTeamBrief } from '@/lib/quick-quiz/buildTeamBrief'
import { designDnaFor } from '@/lib/quick-quiz/designDna'
import { loadDemoBrief } from '@/lib/quick-quiz/demoBrief'
import { shortLabel } from '@/lib/quick-quiz/buildTeamBrief'
import { loadClientCopy, loadQuizData, loadSampleSubmissions } from '@/lib/quick-quiz/load'

afterEach(cleanup)

const data = loadQuizData()
const samples = loadSampleSubmissions()
const sample = (id: string) => {
  const s = samples.find((x) => x.id === id)
  if (!s) throw new Error(`no sample ${id}`)
  return s
}

// Demo styling (2026-11-17): the brief follows the team's screenshots, with
// Analysis and Documentation tabs.
describe('TeamBriefView', () => {
  const demo = loadDemoBrief()
  const demoFor = (id: string) => ({ meeting: demo.meetings[id], inspiration: demo.inspiration, sections: demo.sections })
  const showBrief = (id: string, s = sample(id)) => render(<TeamBriefView brief={buildTeamBrief(s, data)} demo={demoFor(id)} />)
  const tile = (name: string) => screen.getByRole('group', { name })
  const openDocumentation = () => fireEvent.click(screen.getByRole('tab', { name: 'Documentation' }))

  test('the header shows the name, the client type line, the meeting line and a copy button', () => {
    showBrief('decisive-delegator')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Alex Morgan')
    expect(screen.getByText('80% Decisive Delegator')).toBeDefined()
    expect(screen.getByText('Tue 10:30am - Renovation, Burnaby')).toBeDefined()
    expect(screen.getByRole('button', { name: /copy/i })).toBeDefined()
  })

  test('a second client type shows in the header line', () => {
    showBrief('analytical-validator')
    expect(screen.getByText('67% Analytical Validator / 28% Hands-On Controller')).toBeDefined()
  })

  test('Analysis shows first; Documentation shows contact, all answers and inspiration', () => {
    showBrief('cold-explorer')
    expect(screen.getByRole('tab', { name: 'Analysis' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('heading', { name: 'Project Fit' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Contact' })).toBeNull()

    openDocumentation()
    expect(screen.getByRole('tab', { name: 'Documentation' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.queryByRole('heading', { name: 'Project Fit' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeDefined()
    expect(screen.getByText('riley.thompson@example.com')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'All answers' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Inspiration' })).toBeDefined()
    expect(screen.getAllByRole('img').map((img) => img.getAttribute('alt'))).toEqual(demo.inspiration.map((p) => p.alt))
  })

  test('the arrow keys move between the tabs', () => {
    showBrief('cold-explorer')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Analysis' }), { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Documentation' }).getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Documentation' }))
  })

  test('Project Fit: the overall label, the reasons line and three tiles', () => {
    const brief = buildTeamBrief(sample('decisive-delegator'), data)
    showBrief('decisive-delegator')
    expect(screen.getByTestId('lead-temperature').textContent).toBe('Hot')
    expect(screen.getByText(brief.lead.reasons[0])).toBeDefined()
    expect(tile('Project type').textContent).toContain('A renovation')
    expect(tile('Project type').textContent).toContain('Hot from $150K, warm from $50K')
    expect(tile('Investment').getAttribute('data-status')).toBe('hot')
    expect(tile('Warning signs').getAttribute('data-status')).toBe('none')
    expect(tile('Warning signs').textContent).toContain('None')
  })

  test('the Investment tile is yellow for warm and red for cold', () => {
    showBrief('mixed-cautious-controller')
    expect(tile('Investment').getAttribute('data-status')).toBe('warm')
    cleanup()
    const low = sample('decisive-delegator')
    showBrief('decisive-delegator', { ...low, answers: { ...low.answers, investment: 10000 } })
    expect(tile('Investment').getAttribute('data-status')).toBe('cold')
  })

  test('a raised warning sign shows on the Warning signs tile, which says it lowers the label', () => {
    const brief = buildTeamBrief(sample('skipper'), data)
    showBrief('skipper')
    expect(tile('Warning signs').getAttribute('data-status')).toBe('raised')
    expect(tile('Warning signs').textContent).toContain(brief.lead.warningSigns[0].note)
    expect(tile('Warning signs').textContent).toContain('Lowers the label one step')
    expect(screen.getByTestId('lead-temperature').textContent).toBe('Warm')
  })

  test('Client Type: the primary and second types, and a bar for every type with its percent', () => {
    const brief = buildTeamBrief(sample('analytical-validator'), data)
    showBrief('analytical-validator')
    expect(screen.getByText('Primary client type')).toBeDefined()
    expect(screen.getByText('Secondary client type')).toBeDefined()
    const bars = within(screen.getByRole('list', { name: 'Client type breakdown' })).getAllByRole('listitem')
    expect(bars.map((b) => b.textContent)).toEqual(brief.blend.scores.map((sc) => `${shortLabel(sc.label)}${sc.percent}%`))
  })

  test('Fit sits above Client Type', () => {
    showBrief('skipper')
    const fit = screen.getByRole('heading', { name: 'Project Fit' })
    const type = screen.getByRole('heading', { name: 'Client Type' })
    expect(fit.compareDocumentPosition(type) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('says which Design DNA the client was shown', () => {
    showBrief('analytical-validator')
    expect(screen.getByText(/Client was shown:/).textContent).toBe('Client was shown: The Strategist')
  })

  test('a close call shows as a note; a clear client type shows none', () => {
    const brief = buildTeamBrief(sample('out-of-area-hot'), data)
    showBrief('out-of-area-hot')
    expect(screen.getByRole('note', { name: 'Close call' }).textContent).toBe(brief.closeCalls[0])
    cleanup()
    showBrief('cold-explorer')
    expect(screen.queryByRole('note', { name: 'Close call' })).toBeNull()
  })

  test('How to work with them: communication, pacing, pitch, watch for and the tip, for each highlighted type', () => {
    const brief = buildTeamBrief(sample('mixed-cautious-controller'), data)
    showBrief('mixed-cautious-controller')
    for (const h of brief.highlights) {
      expect(screen.getByText(h.communication)).toBeDefined()
      expect(screen.getByText(h.pitch)).toBeDefined()
      expect(screen.getByText(h.risks[0])).toBeDefined()
      expect(screen.getByText(h.tip)).toBeDefined()
    }
  })

  test('Behaviour: time to complete, skipped and the notes', () => {
    const brief = buildTeamBrief(sample('skipper'), data)
    showBrief('skipper')
    const behaviour = within(screen.getByRole('heading', { name: 'Behaviour' }).parentElement!)
    expect(behaviour.getByText('Time to complete')).toBeDefined()
    for (const note of brief.behaviour.notes) expect(behaviour.getByText(note)).toBeDefined()
  })

  test('All answers: four sections that open and close, Project open first, with short labels', () => {
    showBrief('skipper')
    openDocumentation()
    const sections = screen.getAllByRole('group').filter((el) => el.tagName === 'DETAILS')
    expect(sections.map((d) => d.querySelector('summary')?.textContent)).toEqual(['Project', 'Investment + readiness', 'Confidence + home', 'Decision making'])
    expect(sections.map((d) => (d as HTMLDetailsElement).open)).toEqual([true, false, false, false])
    expect(within(sections[0]).getByText('Dreaming up')).toBeDefined()
    expect(within(sections[0]).getByText('A renovation')).toBeDefined()
  })

  test('a skipped answer says Skipped', () => {
    const brief = buildTeamBrief(sample('skipper'), data)
    const skipped = brief.answers.find((a) => a.answer === null)!
    const label = demo.sections.flatMap((sec) => sec.rows).find((r) => r.question === skipped.questionId)!.label
    showBrief('skipper')
    openDocumentation()
    const row = screen.getByText(label).parentElement!
    expect(row.textContent).toContain('Skipped')
  })

  test('says "Not given" for blank contact details', () => {
    const s = sample('cold-explorer')
    showBrief('cold-explorer', { ...s, contact: { name: '', email: '', phone: '', siteAddress: { street: '', city: '', postalCode: '' } } })
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Name not given')
    openDocumentation()
    expect(screen.getAllByText('Not given')).toHaveLength(3)
  })

  test('without demo data, it still shows the brief and lists all answers', () => {
    const brief = buildTeamBrief(sample('cold-explorer'), data)
    render(<TeamBriefView brief={brief} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Riley Thompson')
    openDocumentation()
    expect(screen.getByText(brief.answers[0].prompt)).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Inspiration' })).toBeNull()
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

  test('follows the mockup: done, Design DNA, how we can help, what happens next, thank you', () => {
    render(<ClientResultView result={resultOf('analytical-validator')} />)
    expect(headings()).toEqual(["You're all done!", 'The Strategist', 'How we can help', 'What happens next', 'Thank you!'])
    expect(screen.getByText("Here's what your answers reveal about your design approach.")).toBeDefined()
    // Jaida, 2026-11-23: "Thank you!" stands alone, with no line under it.
    expect(screen.queryByText('You may now exit this screen.')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Thank you!' }).nextElementSibling).toBeNull()
  })

  test('the Design DNA card shows the label, name, headline and paragraph', () => {
    const result = resultOf('analytical-validator')
    render(<ClientResultView result={result} />)
    const card = screen.getByRole('region', { name: 'The Strategist' })
    expect(card.textContent).toContain('DESIGN DNA')
    expect(card.textContent).toContain('You feel most confident when every choice has a reason.')
    expect(card.textContent).toContain(result.designDna!.description)
  })

  test('"How we can help" lists the profile points under the card, each with a bold title and a sentence', () => {
    const result = resultOf('analytical-validator')
    render(<ClientResultView result={result} />)
    const section = screen.getByRole('region', { name: 'How we can help' })
    const items = within(section).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    result.designDna!.help.points.forEach((point, i) => {
      expect(within(items[i]).getByText(point.title).tagName).toBe('STRONG')
      expect(items[i].textContent).toContain(point.text)
    })
    // Straight after the Design DNA card.
    const card = screen.getByRole('region', { name: 'The Strategist' })
    expect(card.nextElementSibling).toBe(section)
  })

  test('each profile shows its own points', () => {
    for (const s of samples) {
      const result = resultOf(s.id)
      if (!result.designDna) continue
      const { unmount } = render(<ClientResultView result={result} />)
      const section = screen.getByRole('region', { name: 'How we can help' })
      for (const point of result.designDna.help.points) expect(section.textContent, s.id).toContain(point.title)
      unmount()
    }
  })

  // The team decided a secondary trait is too much (2026-11-13).
  test('never shows a secondary trait', () => {
    for (const s of samples) {
      const { container, unmount } = render(<ClientResultView result={resultOf(s.id)} />)
      expect(container.textContent?.toLowerCase(), s.id).not.toContain('secondary')
      unmount()
    }
  })

  test('no Design DNA card when there were not enough answers; the rest still shows', () => {
    render(<ClientResultView result={{ ...resultOf('decisive-delegator'), designDna: null }} />)
    expect(screen.queryByText('DESIGN DNA')).toBeNull()
    expect(screen.queryByText('How we can help')).toBeNull()
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

  // Swatch rooms (Jaida, 2026-11-23): no progress bar on the result, with or
  // without the finished room.
  test('no "Questionnaire complete 100%" bar on the result', () => {
    const { unmount } = render(<ClientResultView result={resultOf('decisive-delegator')} />)
    expect(screen.queryByText('Questionnaire complete')).toBeNull()
    unmount()
    render(<ClientResultView result={resultOf('decisive-delegator')} complete />)
    expect(screen.queryByText('Questionnaire complete')).toBeNull()
    expect(screen.queryByText('100%')).toBeNull()
    expect(screen.queryByTestId('progress-fill')).toBeNull()
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
