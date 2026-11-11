import { afterEach, describe, expect, test } from 'vitest'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import Repeater from '@/components/questionnaire/Repeater'
import { parseQuestionnaire } from '@/lib/questionnaire/parse'
import type { RepeaterEntry } from '@/lib/questionnaire/types'

afterEach(cleanup)

const people = parseQuestionnaire({
  steps: [
    {
      id: 's',
      title: 'S',
      questions: [
        {
          id: 'people',
          kind: 'repeater',
          prompt: 'Who lives here?',
          addLabel: 'Add a person',
          max: 3,
          fields: [
            { id: 'name', kind: 'short_text', prompt: 'Name' },
            { id: 'age', kind: 'number', prompt: 'Age' },
          ],
        },
      ],
    },
  ],
}).steps[0].questions[0]

// Holds the answer like the real form does, and shows it for checking.
function Harness({ start, error }: { start?: RepeaterEntry[]; error?: string }) {
  const [value, setValue] = useState<RepeaterEntry[] | undefined>(start)
  return (
    <>
      <Repeater question={people} value={value} onChange={setValue} error={error} />
      <output data-testid="value">{JSON.stringify(value ?? null)}</output>
    </>
  )
}
const stored = () => JSON.parse(screen.getByTestId('value').textContent ?? 'null')

describe('Repeater', () => {
  test('starts with one empty card, inside a group named by the question', () => {
    render(<Harness />)
    expect(screen.getByRole('group', { name: 'Who lives here?' })).toBeDefined()
    expect(screen.getAllByLabelText('Name')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull()
  })

  test('typing in a card stores it, and clearing a number removes it', () => {
    render(<Harness />)
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Pat' } })
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '40' } })
    expect(stored()).toEqual([{ name: 'Pat', age: 40 }])
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '' } })
    expect(stored()).toEqual([{ name: 'Pat' }])
  })

  test('"Add another" adds a card and "Remove" removes one, keeping the others', () => {
    render(<Harness start={[{ name: 'Pat' }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add a person' }))
    expect(screen.getAllByLabelText('Name')).toHaveLength(2)
    fireEvent.change(screen.getAllByLabelText('Name')[1], { target: { value: 'Lee' } })

    const first = screen.getByRole('group', { name: 'Card 1' })
    fireEvent.click(within(first).getByRole('button', { name: 'Remove card 1' }))
    expect(stored()).toEqual([{ name: 'Lee' }])
    expect(screen.getAllByLabelText('Name')).toHaveLength(1)
  })

  test('the add button is turned off at the limit', () => {
    render(<Harness start={[{ name: 'A' }, { name: 'B' }, { name: 'C' }]} />)
    expect((screen.getByRole('button', { name: 'Add a person' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('Up to 3.')).toBeDefined()
  })

  test('shows a problem message', () => {
    render(<Harness error="Please add no more than 3" />)
    expect(screen.getByRole('alert').textContent).toBe('Please add no more than 3')
  })
})
