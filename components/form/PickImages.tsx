'use client'

import Image from 'next/image'
import { BUTTON_SMALL, CARD, HINT, LABEL, PROBLEM } from './styles'
import type { ImagePicks, Question } from '@/lib/form/types'

interface Props {
  question: Question
  value: ImagePicks | undefined
  // undefined when nothing is picked in any set.
  onChange: (value: ImagePicks | undefined) => void
  error?: string
}

type Role = 'favourite' | 'least'

const setName = (id: string) => {
  const words = id.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
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
        <fieldset key={set.id} className={CARD}>
          <legend className="sr-only">Picture set {setIndex + 1}</legend>
          {/* The set's name from its id ("living_rooms" -> "Living rooms"), as in the screenshots. */}
          <p className="text-sm text-neutral-500">{setName(set.id)}</p>
          <div className="grid grid-cols-2 gap-3">
            {set.images.map((image) => (
              <div key={image.id} className="flex flex-col gap-2">
                <Image src={image.src} alt={image.label} width={400} height={300} unoptimized className="aspect-[4/3] h-auto w-full rounded-lg object-cover" />
                {(['favourite', 'least'] as const).map((role) => {
                  const isPicked = picks[set.id]?.[role] === image.id
                  return (
                    <button
                      key={role}
                      type="button"
                      aria-pressed={isPicked}
                      aria-label={`${ROLE_LABEL[role]}: ${image.label}`}
                      onClick={() => choose(set.id, role, image.id)}
                      className={BUTTON_SMALL}
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
