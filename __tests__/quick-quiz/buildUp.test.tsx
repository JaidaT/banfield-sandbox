import { afterEach, describe, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import BuildUpRoom from '@/components/quick-quiz/BuildUpRoom'
import ClientResultView from '@/components/quick-quiz/ClientResultView'
import QuizForm from '@/components/quick-quiz/QuizForm'
import RoomProgressBar from '@/components/quick-quiz/RoomProgressBar'
import { buildClientResult } from '@/lib/quick-quiz/buildClientResult'
import { designDnaFor } from '@/lib/quick-quiz/designDna'
import { loadClientCopy, loadQuizData, loadQuizForm, loadSampleSubmissions } from '@/lib/quick-quiz/load'
import { loadRoomBuild } from '@/lib/quick-quiz/roomBuild'
import { quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'

// The room that builds (docs/ROOM_BUILD_PLAN.md, 2026-11-21): a shorter bar,
// and beside it a room that gains one piece per finished screen.

const quizData = loadQuizData()
const clientCopy = loadClientCopy()
const form = loadQuizForm()
const build = loadRoomBuild()
const questions = quizData.questions
const total = questions.length + 1

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const room = () => screen.getByTestId('build-up-room')
const pieceImages = () => Array.from(room().querySelectorAll<HTMLImageElement>('img[data-piece]'))
const shownPieces = () => pieceImages().filter((img) => img.dataset.shown === 'true').map((img) => img.getAttribute('src'))
const bar = (number: number) => render(<RoomProgressBar place={{ number, total }} stepId="any" placement="build-up" />)

describe('the room that builds, on the question screens', () => {
  test('question 1 shows only the empty room', () => {
    bar(1)
    expect(room().querySelector('img[data-base]')!.getAttribute('src')).toBe(build.base)
    expect(shownPieces()).toEqual([])
  })

  test('each finished screen adds one piece, in order: question 5 shows four, the contact screen twelve', () => {
    bar(5)
    expect(shownPieces()).toEqual(build.pieces.slice(0, 4).map((p) => p.file))
    cleanup()
    bar(total)
    expect(shownPieces()).toEqual(build.pieces.slice(0, 12).map((p) => p.file))
  })

  test('all pieces are on the page from the start, loaded straight away, hidden until earned', () => {
    bar(1)
    expect(pieceImages().map((img) => img.getAttribute('src'))).toEqual(build.pieces.map((p) => p.file))
    for (const img of pieceImages()) expect(img.getAttribute('loading')).toBe('eager')
  })

  test('each piece grows from its own centre', () => {
    bar(1)
    pieceImages().forEach((img, i) => {
      expect(img.style.transformOrigin, build.pieces[i].name).toBe(`${build.pieces[i].centreX}% ${build.pieces[i].centreY}%`)
    })
  })

  test('the room is decoration, hidden from screen readers; they hear "Question N of M"', () => {
    bar(3)
    expect(room().closest('[aria-hidden="true"]')).not.toBeNull()
    for (const img of room().querySelectorAll('img')) expect(img.getAttribute('alt')).toBe('')
    expect(screen.getByText(`Question 3 of ${total}`)).toBeDefined()
    expect(screen.queryByText(/\d+%/)).toBeNull()
  })

  test('the bar and the room share the row, about 60% and 40%', () => {
    bar(3)
    const row = screen.getByTestId('build-up-row')
    expect(row.dataset.placement).toBe('build-up')
    expect(screen.getByTestId('progress-fill')).toBeDefined()
    expect(row.contains(room())).toBe(true)
  })
})

// Jaida, 2026-11-22: the room centred above a full-width bar.
describe('the room that builds, centred above the bar (build-up-middle)', () => {
  const above = (number: number) => render(<RoomProgressBar place={{ number, total }} stepId="any" placement="build-up-middle" />)

  test('the room sits above the bar, centred, and the bar is full width', () => {
    above(3)
    const layout = screen.getByTestId('build-up-row')
    expect(layout.dataset.placement).toBe('build-up-middle')
    const roomBox = room().parentElement!
    const barBox = screen.getByTestId('progress-fill').parentElement!.parentElement!
    // The room comes first (above), then the bar.
    expect(roomBox.compareDocumentPosition(barBox) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(roomBox.dataset.position).toBe('centred')
    expect(barBox.dataset.position).toBe('full-width')
  })

  test('it builds up the same way: none on question 1, four on question 5', () => {
    above(1)
    expect(shownPieces()).toEqual([])
    cleanup()
    above(5)
    expect(shownPieces()).toEqual(build.pieces.slice(0, 4).map((p) => p.file))
  })

  test('hidden from screen readers, who hear "Question N of M"', () => {
    above(2)
    expect(room().closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.getByText(`Question 2 of ${total}`)).toBeDefined()
  })

  test('the result shows the complete room centred above the full bar', () => {
    const sample = loadSampleSubmissions()[0]
    const result = buildClientResult(sample, clientCopy, designDnaFor(sample, quizData))
    render(<ClientResultView result={result} complete buildUpRoom={<BuildUpRoom shownCount={build.pieces.length} popLast />} buildUpLayout="above" />)
    expect(shownPieces()).toEqual(build.pieces.map((p) => p.file))
    expect(screen.getByTestId('complete-build-up').dataset.layout).toBe('above')
  })
})

describe('the room that builds, in the quiz', () => {
  function renderQuiz(startAt: string) {
    render(<QuizForm questionnaire={quizQuestionnaire(questions, form)} quizData={quizData} clientCopy={clientCopy} startAt={startAt} />)
  }

  test('Next adds exactly one piece, Back takes it away, and the same pictures stay on the page', () => {
    renderQuiz(questions[2].id)
    const before = pieceImages()
    expect(shownPieces()).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(shownPieces()).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(shownPieces()).toHaveLength(2)
    pieceImages().forEach((img, i) => expect(img).toBe(before[i]))
  })

  test('the result shows the complete room beside the full bar', () => {
    vi.useFakeTimers()
    renderQuiz('contact')
    fireEvent.click(screen.getByRole('button', { name: 'See my results' }))
    act(() => vi.advanceTimersByTime(0))
    expect(shownPieces()).toEqual(build.pieces.map((p) => p.file))
  })
})

describe('the complete room on the result', () => {
  const sample = loadSampleSubmissions()[0]
  const result = buildClientResult(sample, clientCopy, designDnaFor(sample, quizData))

  test('all 13 pieces show, the last one popping in, hidden from screen readers', () => {
    render(<ClientResultView result={result} complete buildUpRoom={<BuildUpRoom shownCount={build.pieces.length} popLast />} />)
    expect(screen.getByTestId('complete-build-up').dataset.layout).toBe('side')
    expect(shownPieces()).toEqual(build.pieces.map((p) => p.file))
    expect(pieceImages().at(-1)!.className).toContain('piece-pop')
    expect(room().closest('[aria-hidden="true"]')).not.toBeNull()
  })
})
