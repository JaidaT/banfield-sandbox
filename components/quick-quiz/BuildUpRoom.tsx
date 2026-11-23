import Image from 'next/image'
import { loadRoomBuild } from '@/lib/quick-quiz/roomBuild'

// The empty room and its pieces (data/quick-quiz/room-build.json).
const BUILD = loadRoomBuild()

// A shown piece grows in from its own centre with a slight bounce; a hidden
// one shrinks into it. With reduced motion, a quick fade instead.
const SHOWN =
  'scale-100 opacity-100 transition-[scale,opacity] duration-300 delay-100 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:delay-0 motion-reduce:duration-150'
const HIDDEN = 'scale-0 opacity-0 transition-[scale,opacity] duration-200 ease-in motion-reduce:scale-100 motion-reduce:duration-150'

// The room that builds (docs/ROOM_BUILD_PLAN.md): the empty room with the
// first `shownCount` pieces showing. Every piece is on the page from the
// start, loaded straight away and hidden until earned, so nothing has to load
// mid-change. All files share one artboard, so they stack exactly.
// popLast: the last shown piece pops in when this first appears (the result).
// showBase: false leaves out the empty room, so only the pieces show
// (build-up-follow, Jaida 2026-11-22).
// baseArrives: the empty room (walls and floor) fades in behind the pieces
// when this first appears: the finishing touch on the result (Jaida,
// 2026-11-22). It also turns the empty room on.
// Decoration only: whatever holds it hides it from screen readers.
export default function BuildUpRoom({
  shownCount,
  popLast = false,
  showBase = true,
  baseArrives = false,
}: {
  shownCount: number
  popLast?: boolean
  showBase?: boolean
  baseArrives?: boolean
}) {
  return (
    <div data-testid="build-up-room" className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
      {(showBase || baseArrives) && (
        <Image
          data-base
          src={BUILD.base}
          alt=""
          width={BUILD.width}
          height={BUILD.height}
          unoptimized
          loading="eager"
          className={`absolute inset-0 h-full w-full ${baseArrives ? 'base-arrive' : ''}`}
        />
      )}
      {BUILD.pieces.map((piece, index) => {
        const shown = index < shownCount
        const popping = popLast && index === shownCount - 1
        return (
          <Image
            key={piece.file}
            data-piece
            data-shown={shown}
            src={piece.file}
            alt=""
            width={BUILD.width}
            height={BUILD.height}
            unoptimized
            loading="eager"
            style={{ transformOrigin: `${piece.centreX}% ${piece.centreY}%` }}
            className={`absolute inset-0 h-full w-full ${shown ? SHOWN : HIDDEN} ${popping ? 'piece-pop' : ''}`}
          />
        )
      })}
    </div>
  )
}
