import BuildUpRoom from '@/components/quick-quiz/BuildUpRoom'

// Swatch cards + the room that builds (docs/SWATCH_ROOMS_PLAN.md): the room
// centred above a full-width bar (white track, yellow outline and fill, no
// percentage text). The room is about a quarter of the width on a phone, so
// the card still fits, and 40% on a computer. Used on the question cards,
// during "Calculating" and on the result.
// shownCount: how many pieces are earned. percent: how full the bar is.
// popLast: the last piece pops in when this appears. label: what screen
// readers hear for progress ("Question N of M"); the room and bar are
// decoration and hidden from them.
// Only the pieces show, without the empty room behind them (Jaida, 2026-11-22).
export default function RoomAndBar({ shownCount, percent, popLast = false, label }: { shownCount: number; percent: number; popLast?: boolean; label?: string }) {
  return (
    <div className="flex flex-col">
      {label ? <p className="sr-only">{label}</p> : null}
      <div aria-hidden="true" className="flex flex-col items-center gap-1">
        <div className="w-1/4 sm:w-2/5">
          <BuildUpRoom shownCount={shownCount} popLast={popLast} showBase={false} />
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
