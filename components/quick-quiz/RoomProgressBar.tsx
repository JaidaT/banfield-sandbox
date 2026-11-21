import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { ProgressBarProps } from '@/components/form/ProgressBar'
import { percentDone } from '@/lib/form/navigation'
import { loadProgressRooms } from '@/lib/quick-quiz/progressRooms'

// Which room goes with which screen (data/quick-quiz/progress-rooms.json).
const ROOMS = loadProgressRooms()
// Each room once, in screen order.
const ALL_ROOMS = Object.entries(ROOMS.screens)

// The current room fades in after a short pause; the others fade out quickly,
// so the two barely overlap (Jaida, 2026-11-21). With reduced motion there is
// no pause.
const SHOWN = 'opacity-100 transition-opacity duration-250 delay-100 ease-out motion-reduce:delay-0'
const HIDDEN = 'opacity-0 transition-opacity duration-150 ease-in'

// The Quick Quiz's progress bar (docs/ROOM_PROGRESS_PLAN.md): a white track
// with a yellow outline and fill, and a room graphic on top. No percentage
// text; screen readers hear "Question N of M".
//
// All the rooms are on the page from the first screen, loaded straight away,
// with only the current one visible. Changing screens only fades between
// them, so nothing has to load mid-change (which made rooms pop in and out).
// The rooms sit at the right end of a box as wide as the fill (but never
// narrower than the current room), so the room's right edge follows the end
// of the fill, starts at the far left, and slides as the fill grows.
export default function RoomProgressBar({ place, stepId }: ProgressBarProps) {
  const percent = percentDone(place)
  const current = ROOMS.screens[stepId]
  const box = {
    width: `${percent}%`,
    // The current room's width at the bar's room height (--room-h).
    minWidth: current ? `calc(var(--room-h) * ${current.width / current.height})` : undefined,
  } as CSSProperties

  return (
    <div className="flex flex-col">
      <p className="sr-only">{`Question ${place.number} of ${place.total}`}</p>
      <div aria-hidden="true" className="flex flex-col gap-1 [--room-h:3.5rem] sm:[--room-h:4.5rem]">
        <div className="relative h-[var(--room-h)]">
          <div
            data-testid="progress-room"
            style={box}
            className="absolute inset-y-0 left-0 transition-[width,min-width] duration-400 ease-out motion-reduce:transition-none"
          >
            {ALL_ROOMS.map(([screenId, room]) => (
              <Image
                key={screenId}
                src={room.file}
                alt=""
                width={room.width}
                height={room.height}
                unoptimized
                loading="eager"
                data-current={screenId === stepId}
                className={`absolute right-0 bottom-0 h-full w-auto max-w-none ${screenId === stepId ? SHOWN : HIDDEN}`}
              />
            ))}
          </div>
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
