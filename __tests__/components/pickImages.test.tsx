import { afterEach, describe, expect, test } from 'vitest'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import PickImages from '@/components/questionnaire/PickImages'
import { loadQuestionnaire } from '@/lib/questionnaire/load'
import type { ImagePicks } from '@/lib/questionnaire/types'

afterEach(cleanup)

const styleSets = loadQuestionnaire()
  .steps.flatMap((s) => s.questions)
  .find((q) => q.id === 'style_sets')!

function Harness() {
  const [value, setValue] = useState<ImagePicks | undefined>(undefined)
  return (
    <>
      <PickImages question={styleSets} value={value} onChange={setValue} />
      <output data-testid="value">{JSON.stringify(value ?? null)}</output>
    </>
  )
}
const stored = () => JSON.parse(screen.getByTestId('value').textContent ?? 'null')
const button = (name: string) => screen.getByRole('button', { name })
const pressed = (name: string) => button(name).getAttribute('aria-pressed')

describe('PickImages', () => {
  test('shows each picture set with its pictures', () => {
    render(<Harness />)
    expect(screen.getByRole('group', { name: 'Picture set 1' })).toBeDefined()
    expect(screen.getByRole('group', { name: 'Picture set 2' })).toBeDefined()
    expect(screen.getByAltText('Kitchen C')).toBeDefined()
  })

  test('picks a favourite and a least favourite in a set', () => {
    render(<Harness />)
    fireEvent.click(button('Favourite: Kitchen A'))
    fireEvent.click(button('Least favourite: Kitchen C'))
    expect(stored()).toEqual({ kitchens: { favourite: 'a', least: 'c' } })
    expect(pressed('Favourite: Kitchen A')).toBe('true')
    expect(pressed('Favourite: Kitchen B')).toBe('false')
  })

  test('picking the favourite as least favourite moves it, so one picture is never both', () => {
    render(<Harness />)
    fireEvent.click(button('Favourite: Kitchen A'))
    fireEvent.click(button('Least favourite: Kitchen A'))
    expect(stored()).toEqual({ kitchens: { least: 'a' } })
  })

  test('tapping a picked button again un-picks it', () => {
    render(<Harness />)
    fireEvent.click(button('Favourite: Living room B'))
    fireEvent.click(button('Favourite: Living room B'))
    expect(stored()).toBeNull()
  })
})
