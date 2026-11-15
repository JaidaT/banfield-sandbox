import { describe, expect, test } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import QuizForm from '@/components/quick-quiz/QuizForm'
import { heightMessage, newScreenMessage } from '@/lib/quick-quiz/embed'
import { loadClientCopy, loadQuizData, loadQuizForm } from '@/lib/quick-quiz/load'
import { quizQuestionnaire } from '@/lib/quick-quiz/toQuestionnaire'
import { parentPost, pretendIframe, sent, setContentBottom, setUpIframeStandIns } from './pretendIframe'

// The Quick Quiz inside an iframe on a website (DECISIONS.md 2026-11-15).
setUpIframeStandIns()

const quizData = loadQuizData()

function renderQuiz() {
  render(
    <QuizForm
      questionnaire={quizQuestionnaire(quizData.questions, loadQuizForm())}
      quizData={quizData}
      clientCopy={loadClientCopy()}
    />,
  )
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const newScreens = () => sent().filter((m) => m.type === 'new-screen')

describe('QuizForm in an iframe', () => {
  test('sends its height when it opens', () => {
    pretendIframe()
    setContentBottom(720)
    renderQuiz()
    expect(sent()).toEqual([heightMessage(720)])
  })

  test('sends a new-screen message on "Let\'s start", Next and Back', () => {
    pretendIframe()
    renderQuiz()
    click("Let's start")
    expect(newScreens()).toEqual([newScreenMessage()])
    click('Next')
    expect(newScreens()).toHaveLength(2)
    click('Back')
    expect(newScreens()).toHaveLength(3)
  })
})

describe('QuizForm on its own page', () => {
  test('sends nothing', () => {
    renderQuiz()
    click("Let's start")
    click('Next')
    expect(parentPost).not.toHaveBeenCalled()
  })
})
