import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { ProgressBarProps } from '@/components/form/ProgressBar'
import BuildUpRoom from '@/components/quick-quiz/BuildUpRoom'
import { percentDone } from '@/lib/form/navigation'
import { loadProgressRooms } from '@/lib/quick-quiz/progressRooms'
import type { Placement } from '@/lib/quick-quiz/progressRooms'

// Which room goes with which screen, and where it sits
// (data/quick-quiz/progress-rooms.json).
const ROOMS = loadProgressRooms()
// Each room once, in screen order.
const ALL_ROOMS = Object.entries(ROOMS.screens)

// How the rooms change, for each placement. The old room goes quickly and
// the new one comes a moment later, so the two barely overlap.
// - follow-fill (version 1): a fade, while the room slides with the fill.
// - far-right (version 2) and middle (version 3): the old room shrinks into
//   the bar and the new one grows up from it with a slight bounce (Jaida,
//   2026-11-21).
// With reduced motion, both are a quick fade with no pause.
const SHRINK_AND_GROW = {
  shown:
    'origin-bottom scale-100 opacity-100 transition-[scale,opacity] duration-300 delay-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:delay-0 motion-reduce:duration-150',
  hidden: 'origin-bottom scale-0 opacity-0 transition-[scale,opacity] duration-200 ease-in motion-reduce:scale-100 motion-reduce:duration-150',
}
const CHANGES: Record<Placement, { shown: string; hidden: string }> = {
  'follow-fill': {
    shown: 'opacity-100 transition-opacity duration-250 delay-100 ease-out motion-reduce:delay-0',
    hidden: 'opacity-0 transition-opacity duration-150 ease-in',
  },
  'far-right': SHRINK_AND_GROW,
  middle: SHRINK_AND_GROW,
  'build-up': SHRINK_AND_GROW,
  'build-up-middle': SHRINK_AND_GROW,
}

// Where the rooms' box sits on the bar. In the middle, each room is also
// centred in the box, so rooms of different widths share one centre.
const BOX_PLACE: Record<Placement, string> = {
  'follow-fill': 'left-0',
  'far-right': 'right-0',
  middle: 'left-1/2 -translate-x-1/2',
  'build-up': 'left-0',
  'build-up-middle': 'left-0',
}

// The Quick Quiz's progress bar (docs/ROOM_PROGRESS_PLAN.md): a white track
// with a yellow outline and fill, and a room graphic on top. No percentage
// text; screen readers hear "Question N of M".
//
// All the rooms are on the page from the first screen, loaded straight away,
// with only the current one visible, so nothing has to load mid-change.
// follow-fill: the rooms sit at the right end of a box as wide as the fill
// (but never narrower than the current room), so the room's right edge
// follows the end of the fill and slides as it grows.
// far-right: the rooms sit at the right end of the bar on every screen.
// middle: the rooms sit in the middle of the bar on every screen.
// placement: for tests and comparisons; left out, the data file decides.
export default function RoomProgressBar({ place, stepId, placement = ROOMS.placement }: ProgressBarProps & { placement?: Placement }) {
  const percent = percentDone(place)
  if (placement === 'build-up' || placement === 'build-up-middle') return <BuildUpBar place={place} percent={percent} placement={placement} />
  const current = ROOMS.screens[stepId]
  const followFill = placement === 'follow-fill'
  const box = {
    width: followFill ? `${percent}%` : undefined,
    // The current room's width at the bar's room height (--room-h).
    minWidth: current ? `calc(var(--room-h) * ${current.width / current.height})` : undefined,
  } as CSSProperties
  const change = CHANGES[placement]

  return (
    <div className="flex flex-col">
      <p className="sr-only">{`Question ${place.number} of ${place.total}`}</p>
      <div aria-hidden="true" className="flex flex-col gap-1 [--room-h:3.5rem] sm:[--room-h:4.5rem]">
        <div className="relative h-[var(--room-h)]">
          <div
            data-testid="progress-room"
            data-placement={placement}
            style={box}
            className={`absolute inset-y-0 transition-[width,min-width] duration-400 ease-out motion-reduce:transition-none ${BOX_PLACE[placement]}`}
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
                className={`absolute bottom-0 h-full w-auto max-w-none ${placement === 'middle' ? 'left-1/2 -translate-x-1/2' : 'right-0'} ${screenId === stepId ? change.shown : change.hidden}`}
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

// The room that builds (docs/ROOM_BUILD_PLAN.md). The room shows one piece
// per finished screen: none on question 1.
// - build-up (version 4): a shorter bar (about 60%) beside the room (about
//   40%), lined up at the bottom.
// - build-up-middle (version 5, Jaida 2026-11-22): the room centred above a
//   full-width bar, at the same size (about 40% of the width).
function BuildUpBar({ place, percent, placement }: { place: ProgressBarProps['place']; percent: number; placement: 'build-up' | 'build-up-middle' }) {
  const above = placement === 'build-up-middle'
  // Above the bar it comes first; beside the bar it comes after (on the right).
  const room = (
    <div data-position={above ? 'centred' : 'right'} className={above ? 'w-2/5' : 'flex-[2]'}>
      <BuildUpRoom shownCount={place.number - 1} />
    </div>
  )
  return (
    <div className="flex flex-col">
      <p className="sr-only">{`Question ${place.number} of ${place.total}`}</p>
      <div
        data-testid="build-up-row"
        data-placement={placement}
        aria-hidden="true"
        className={above ? 'flex flex-col items-center gap-1' : 'flex items-end gap-3'}
      >
        {above && room}
        <div data-position={above ? 'full-width' : 'left'} className={above ? 'w-full' : 'flex-[3] pb-1'}>
          <div className="h-3.5 w-full overflow-hidden rounded-full border-2 border-accent bg-white">
            <div
              data-testid="progress-fill"
              className="h-full rounded-full bg-accent transition-[width] duration-400 ease-out motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        {!above && room}
      </div>
    </div>
  )
}
