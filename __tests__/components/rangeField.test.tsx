import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import QuestionInput from '@/components/questionnaire/QuestionInput'
import { parseQuestionnaire } from '@/lib/questionnaire/load'
import type { Question } from '@/lib/questionnaire/types'

afterEach(cleanup)

// Builds one question through the real parser, so defaults match the data file.
function question(raw: Record<string, unknown>): Question {
  return parseQuestionnaire({ steps: [{ id: 's', title: 'S', questions: [raw] }] }).steps[0].questions[0]
}

// Like the Quick Quiz investment question.
const investment = question({
  id: 'investment',
  kind: 'range',
  prompt: 'Roughly what investment feels comfortable?',
  help: 'A ballpark is perfect.',
  min: 0,
  max: 500000,
  step: 10000,
  format: 'money',
  options: [{ id: 'not_sure', label: 'Not sure yet' }],
})

const slider = () => screen.getByRole('slider', { name: 'Roughly what investment feels comfortable?' }) as HTMLInputElement
const notSure = () => screen.getByRole('button', { name: 'Not sure yet' })

describe('slider (range) questions', () => {
  test('moving the slider reports a number', () => {
    const onChange = vi.fn()
    render(<QuestionInput question={investment} value={undefined} onChange={onChange} />)
    fireEvent.change(slider(), { target: { value: '200000' } })
    expect(onChange).toHaveBeenLastCalledWith(200000)
  })

  test('the slider uses the question numbers, and shows the hint', () => {
    render(<QuestionInput question={investment} value={undefined} onChange={() => {}} />)
    expect([slider().min, slider().max, slider().step]).toEqual(['0', '500000', '10000'])
    expect(screen.getByText('A ballpark is perfect.')).toBeDefined()
  })

  test('it starts with no answer and says so', () => {
    const onChange = vi.fn()
    render(<QuestionInput question={investment} value={undefined} onChange={onChange} />)
    expect(screen.getByText('No answer yet')).toBeDefined()
    expect(onChange).not.toHaveBeenCalled()
  })

  // The chosen amount is the line above the slider; "$0" and "$500K+" also
  // label the two ends of the slider, so look only at the chosen-amount line.
  const chosen = (text: string) => screen.getByText(text, { selector: '[aria-live]' })

  test('the chosen amount is shown as money, with a "+" at the top', () => {
    const { rerender } = render(<QuestionInput question={investment} value={200000} onChange={() => {}} />)
    expect(chosen('$200K')).toBeDefined()
    expect(slider().getAttribute('aria-valuetext')).toBe('$200K')
    rerender(<QuestionInput question={investment} value={500000} onChange={() => {}} />)
    expect(chosen('$500K+')).toBeDefined()
    rerender(<QuestionInput question={investment} value={0} onChange={() => {}} />)
    expect(chosen('$0')).toBeDefined()
  })

  test('the two ends of the slider are labelled', () => {
    render(<QuestionInput question={investment} value={undefined} onChange={() => {}} />)
    expect(screen.getByText('$0')).toBeDefined()
    expect(screen.getByText('$500K+')).toBeDefined()
  })

  test('without a format the plain number is shown', () => {
    const rooms = question({ id: 'rooms', kind: 'range', prompt: 'How many rooms?', min: 1, max: 10, step: 1 })
    render(<QuestionInput question={rooms} value={4} onChange={() => {}} />)
    expect(chosen('4')).toBeDefined()
  })

  test('"Not sure yet" reports its id, and tapping it again clears the answer', () => {
    const onChange = vi.fn()
    const { rerender } = render(<QuestionInput question={investment} value={undefined} onChange={onChange} />)
    expect(notSure().getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(notSure())
    expect(onChange).toHaveBeenLastCalledWith('not_sure')

    rerender(<QuestionInput question={investment} value="not_sure" onChange={onChange} />)
    expect(notSure().getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByText('Not sure yet')).toHaveLength(2)
    fireEvent.click(notSure())
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })

  test('moving the slider after "Not sure yet" switches back to a number', () => {
    const onChange = vi.fn()
    render(<QuestionInput question={investment} value="not_sure" onChange={onChange} />)
    fireEvent.change(slider(), { target: { value: '100000' } })
    expect(onChange).toHaveBeenLastCalledWith(100000)
  })

  test('shows a problem message and marks the question', () => {
    render(<QuestionInput question={investment} value={undefined} onChange={() => {}} error="Please answer" />)
    expect(screen.getByRole('alert').textContent).toBe('Please answer')
    expect(screen.getByRole('group', { name: 'Roughly what investment feels comfortable?' }).getAttribute('aria-invalid')).toBe('true')
  })
})
