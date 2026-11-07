import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import QuestionField from '@/components/questionnaire/QuestionField'
import { parseQuestionnaire } from '@/lib/questionnaire/load'
import type { Question } from '@/lib/questionnaire/types'

afterEach(cleanup)

// Builds one question through the real parser, so defaults match the data file.
function question(raw: Record<string, unknown>): Question {
  return parseQuestionnaire({ steps: [{ id: 's', title: 'S', questions: [raw] }] }).steps[0].questions[0]
}

const yesNo = question({
  id: 'has_pets',
  kind: 'single',
  prompt: 'Any pets?',
  help: 'Fish count.',
  options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }],
})

describe('QuestionField', () => {
  test('text: a labelled box that reports what is typed, and the hint', () => {
    const onChange = vi.fn()
    render(<QuestionField question={question({ id: 'name', kind: 'short_text', prompt: 'Your name', help: 'First and last.' })} value={undefined} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Pat' } })
    expect(onChange).toHaveBeenCalledWith('Pat')
    expect(screen.getByText('First and last.')).toBeDefined()
  })

  test('number: reports a number, and nothing when cleared', () => {
    const onChange = vi.fn()
    render(<QuestionField question={question({ id: 'age', kind: 'number', prompt: 'Age' })} value={40} onChange={onChange} />)
    const box = screen.getByLabelText('Age')
    fireEvent.change(box, { target: { value: '41' } })
    expect(onChange).toHaveBeenLastCalledWith(41)
    fireEvent.change(box, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })

  test('single choice: radio buttons in a group named by the question', () => {
    const onChange = vi.fn()
    render(<QuestionField question={yesNo} value="no" onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Any pets?' })).toBeDefined()
    expect((screen.getByLabelText('No') as HTMLInputElement).checked).toBe(true)
    fireEvent.click(screen.getByLabelText('Yes'))
    expect(onChange).toHaveBeenCalledWith('yes')
  })

  test('multiple choice: ticking adds to the list and unticking removes', () => {
    const multi = question({
      id: 'rooms',
      kind: 'multi',
      prompt: 'Which rooms?',
      options: [{ id: 'kitchen', label: 'Kitchen' }, { id: 'den', label: 'Den' }],
    })
    const onChange = vi.fn()
    render(<QuestionField question={multi} value={['kitchen']} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Den'))
    expect(onChange).toHaveBeenLastCalledWith(['kitchen', 'den'])
    fireEvent.click(screen.getByLabelText('Kitchen'))
    expect(onChange).toHaveBeenLastCalledWith(undefined)
  })

  test('a choice with a picture shows it next to the label', () => {
    const style = question({
      id: 'style',
      kind: 'multi',
      prompt: 'Your style?',
      options: [{ id: 'glam', label: 'Sophisticated Glam', image: '/questionnaire/style-sophisticated-glam.svg' }],
    })
    const { container } = render(<QuestionField question={style} value={undefined} onChange={() => {}} />)
    expect(container.querySelector('img')?.getAttribute('src')).toContain('style-sophisticated-glam.svg')
    expect(screen.getByLabelText('Sophisticated Glam')).toBeDefined()
  })

  test('shows a problem message and marks the input', () => {
    render(<QuestionField question={question({ id: 'name', kind: 'short_text', prompt: 'Your name' })} value={undefined} onChange={() => {}} error='Please answer "Your name"' />)
    expect(screen.getByRole('alert').textContent).toBe('Please answer "Your name"')
    expect(screen.getByLabelText('Your name').getAttribute('aria-invalid')).toBe('true')
  })
})
