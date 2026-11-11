'use client'

import Image from 'next/image'
import { HINT, LABEL, PROBLEM } from './styles'
import type { ImagePicks, Question } from '@/lib/form/types'

interface Props {
  question: Question
  value: ImagePicks | undefined
  // undefined when nothing is picked in any set.
  onChange: (value: ImagePicks | undefined) => void
  error?: string
}

type Role = 'favourite' | 'least'
const ROLE_LABEL: Record<Role, string> = { favourite: 'Favourite', least: 'Least favourite' }

// Pick a favourite and a least favourite in each picture set. Big buttons
// under each picture so it works with a thumb on a phone.
export default function PickImages({ question, value, onChange, error }: Props) {
  const picks = value ?? {}

  const choose = (setId: string, role: Role, imageId: string) => {
    const pick = { ...picks[setId] }
    const other: Role = role === 'favourite' ? 'least' : 'favourite'
    if (pick[role] === imageId) {
      delete pick[role] // tapping again un-picks
    } else {
      pick[role] = imageId
      if (pick[other] === imageId) delete pick[other] // one picture is never both
    }
    const next = { ...picks, [setId]: pick }
    if (!pick.favourite && !pick.least) delete next[setId]
    onChange(Object.keys(next).length > 0 ? next : undefined)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className={LABEL}>{question.prompt}</p>
      {question.help ? <p className={HINT}>{question.help}</p> : null}

      {(question.imageSets ?? []).map((set, setIndex) => (
        <fieldset key={set.id} className="flex flex-col gap-2 rounded border border-neutral-400 p-3">
          <legend className="px-1 text-sm text-neutral-600">Picture set {setIndex + 1}</legend>
          <div className="grid grid-cols-2 gap-3">
            {set.images.map((image) => (
              <div key={image.id} className="flex flex-col gap-2">
                <Image src={image.src} alt={image.label} width={400} height={300} unoptimized className="h-auto w-full rounded border border-neutral-300" />
                {(['favourite', 'least'] as const).map((role) => {
                  const isPicked = picks[set.id]?.[role] === image.id
                  return (
                    <button
                      key={role}
                      type="button"
                      aria-pressed={isPicked}
                      aria-label={`${ROLE_LABEL[role]}: ${image.label}`}
                      onClick={() => choose(set.id, role, image.id)}
                      className={`rounded border px-2 py-2 text-sm font-semibold ${
                        isPicked ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-500 bg-white'
                      }`}
                    >
                      {ROLE_LABEL[role]}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      {error ? (
        <p role="alert" className={PROBLEM}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
