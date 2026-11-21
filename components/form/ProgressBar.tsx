import { percentDone } from '@/lib/form/navigation'

// How progress reads: "Step 4 of 11" or a percentage done ("31%").
export type ProgressStyle = 'steps' | 'percent'

// Centred progress text over a yellow bar on a grey track (demo styling,
// 2026-11-17). Used by the step screen and the Quick Quiz's swatch cards.
export default function ProgressBar({ place, progressAs = 'steps' }: { place: { number: number; total: number }; progressAs?: ProgressStyle }) {
  const percent = progressAs === 'percent' ? percentDone(place) : Math.round((place.number / place.total) * 100)
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-xs font-semibold text-charcoal">
        {progressAs === 'percent' ? `${percentDone(place)}%` : `Step ${place.number} of ${place.total}`}
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--track)]" aria-hidden="true">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
