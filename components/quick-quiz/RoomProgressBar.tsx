'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ProgressBarProps } from '@/components/form/ProgressBar'
import RoomImage from '@/components/quick-quiz/RoomImage'
import { moveLength } from '@/components/quick-quiz/motion'
import { percentDone } from '@/lib/form/navigation'
import { loadProgressRooms } from '@/lib/quick-quiz/progressRooms'
import type { Room } from '@/lib/quick-quiz/progressRooms'

// Which room goes with which screen (data/quick-quiz/progress-rooms.json).
const ROOMS = loadProgressRooms()

// The room on its way out while the new one comes in.
interface Leaving {
  key: number
  room: Room
  percent: number
  length: number
}

// The room's box is as wide as the fill, but never narrower than the room,
// and the room sits at its right end: so its right edge follows the end of
// the fill, and at the start it rests at the far left.
const ROOM_BOX = 'absolute inset-y-0 left-0 flex min-w-max justify-end'

// The Quick Quiz's progress bar (docs/ROOM_PROGRESS_PLAN.md): a white track
// with a yellow outline and fill, and a room graphic on top. No percentage
// text; screen readers hear "Question N of M". On a new screen the old room
// fades out where it was while the new one fades in and slides with the fill.
export default function RoomProgressBar({ place, stepId }: ProgressBarProps) {
  const percent = percentDone(place)
  const room = ROOMS.screens[stepId]

  // The screen shown last, so a new screen can start a move from it. Updated
  // while rendering (the React pattern for storing earlier render values).
  const [shown, setShown] = useState({ stepId, percent })
  const [leaving, setLeaving] = useState<Leaving | null>(null)
  if (shown.stepId !== stepId) {
    const length = moveLength()
    const oldRoom = ROOMS.screens[shown.stepId]
    setLeaving(length > 0 && oldRoom ? { key: (leaving?.key ?? 0) + 1, room: oldRoom, percent: shown.percent, length } : null)
    setShown({ stepId, percent })
  }

  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => setLeaving(null), leaving.length)
    return () => clearTimeout(timer)
  }, [leaving])

  const timing = { '--move': `${leaving?.length ?? 0}ms` } as CSSProperties

  return (
    <div className="flex flex-col">
      <p className="sr-only">{`Question ${place.number} of ${place.total}`}</p>
      <div aria-hidden="true" className="flex flex-col gap-1">
        <div className="relative h-14 sm:h-[72px]">
          {leaving && (
            <div key={leaving.key} data-testid="leaving-room" style={{ ...timing, width: `${leaving.percent}%` }} className={`${ROOM_BOX} room-out`}>
              <RoomImage room={leaving.room} />
            </div>
          )}
          {room && (
            <div
              data-testid="progress-room"
              style={{ ...timing, width: `${percent}%` }}
              className={`${ROOM_BOX} transition-[width] duration-400 ease-out motion-reduce:transition-none`}
            >
              <RoomImage key={stepId} room={room} className={leaving ? 'room-in' : ''} />
            </div>
          )}
        </div>
        <div className="h-3.5 w-full overflow-hidden rounded-full border-2 border-accent bg-white">
          <div
            data-testid="progress-fill"
            className="h-full rounded-full bg-accent transition-[width] duration-400 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
