import { afterEach, describe, expect, test } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ClientResultView from '@/components/quick-quiz/ClientResultView'
import QuizForm from '@/components/quick-quiz/QuizForm'
import RoomProgressBar from '@/components/quick-quiz/RoomProgressBar'
import { buildClientResult } from '@/lib/quick-quiz/buildClientResult'
import { designDnaFor } from '@/lib/quick-quiz/designDna'
import { loadClientCopy, loadQuizData, loadQuizForm, loadSampleSubmissions } from '@/lib/quick-quiz/load'
import { loadProgressRooms } from '@/lib/quick-quiz/progressRooms'
import { quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'

// Room progress bar (docs/ROOM_PROGRESS_PLAN.md, 2026-11-21).

const quizData = loadQuizData()
const clientCopy = loadClientCopy()
const form = loadQuizForm()
const rooms = loadProgressRooms()
const questions = quizData.questions

function renderQuiz(startAt?: string) {
  render(<QuizForm questionnaire={quizQuestionnaire(questions, form)} quizData={quizData} clientCopy={clientCopy} startAt={startAt} />)
}

// The room graphics are decorative, so they are found by their file. All
// rooms are on the page from the start (so none has to load mid-change); only
// the current one is visible.
const roomImages = () => Array.from(document.querySelectorAll<HTMLImageElement>('[data-testid="progress-room"] img'))
const shownRoom = () => roomImages().filter((img) => img.dataset.current === 'true').map((img) => img.getAttribute('src'))

afterEach(cleanup)

// The bar with the first version's placement, whatever the data file says.
function renderFollowFill(startAt: string) {
  render(<RoomProgressBar place={placeOf(startAt)} stepId={startAt} placement="follow-fill" />)
}
const screenIds = [...questions.map((q) => q.id), 'contact']
const placeOf = (id: string) => ({ number: screenIds.indexOf(id) + 1, total: screenIds.length })

describe('room progress bar on the question screens', () => {
  test('each screen shows its own room', () => {
    for (const id of [...questions.map((q) => q.id), 'contact']) {
      renderQuiz(id)
      expect(shownRoom(), id).toEqual([rooms.screens[id].file])
      cleanup()
    }
  })

  test('the room is decoration: empty alt text, hidden from screen readers', () => {
    renderQuiz('coffee')
    expect(roomImages()[0].getAttribute('alt')).toBe('')
    expect(screen.getByTestId('progress-room').closest('[aria-hidden="true"]')).not.toBeNull()
  })

  test('no percentage shows; screen readers hear "Question N of M"', () => {
    renderQuiz('coffee')
    expect(screen.queryByText(/\d+%/)).toBeNull()
    const index = questions.findIndex((q) => q.id === 'coffee')
    expect(screen.getByText(`Question ${index + 1} of 13`)).toBeDefined()
  })

  test('the far-right version: the room sits at the right end of the bar on every screen', () => {
    for (const id of [questions[0].id, 'contact']) {
      renderQuiz(id)
      const box = screen.getByTestId('progress-room')
      expect(box.dataset.placement, id).toBe('far-right')
      expect(box.style.width, id).toBe('')
      cleanup()
    }
  })

  test("the follow-fill version: the room's right edge follows the end of the fill, and starts at the far left", () => {
    renderFollowFill(questions[0].id)
    expect(screen.getByTestId('progress-fill').style.width).toBe('0%')
    expect(screen.getByTestId('progress-room').style.width).toBe('0%')
    cleanup()
    renderFollowFill('contact')
    // The contact screen is 12 of 13 done: about 92%.
    expect(screen.getByTestId('progress-fill').style.width).toBe('92%')
    expect(screen.getByTestId('progress-room').style.width).toBe('92%')
  })

  test('Next shows the next room; Back shows the previous one', () => {
    renderQuiz(questions[0].id)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(shownRoom()).toEqual([rooms.screens[questions[1].id].file])
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(shownRoom()).toEqual([rooms.screens[questions[0].id].file])
  })

  // Jaida, 2026-11-21: rooms popped in and out, and overlapped. All rooms now
  // load once and stay on the page; changing screens only fades between them.
  test('every room is on the page from the start, loaded straight away, with only the current one visible', () => {
    renderQuiz(questions[0].id)
    const files = roomImages().map((img) => img.getAttribute('src'))
    expect(new Set(files)).toEqual(new Set(Object.values(rooms.screens).map((r) => r.file)))
    for (const img of roomImages()) expect(img.getAttribute('loading'), img.src).toBe('eager')
    expect(shownRoom()).toEqual([rooms.screens[questions[0].id].file])
  })

  test('changing screens keeps the same room pictures on the page (nothing is re-added)', () => {
    renderQuiz(questions[0].id)
    const before = roomImages()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    const after = roomImages()
    expect(after).toHaveLength(before.length)
    after.forEach((img, i) => expect(img).toBe(before[i]))
  })
})

describe('the finished home on the result', () => {
  const sample = loadSampleSubmissions()[0]
  const result = buildClientResult(sample, clientCopy, designDnaFor(sample, quizData))

  test('the 100% bar shows the finished-home rooms, hidden from screen readers', () => {
    render(<ClientResultView result={result} complete finishedHome={rooms.finishedHome} />)
    const home = screen.getByTestId('finished-home')
    expect(Array.from(home.querySelectorAll('img')).map((img) => img.getAttribute('src'))).toEqual(rooms.finishedHome.map((r) => r.file))
    expect(home.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  test('without the complete bar, no rooms', () => {
    render(<ClientResultView result={result} finishedHome={rooms.finishedHome} />)
    expect(screen.queryByTestId('finished-home')).toBeNull()
  })
})
