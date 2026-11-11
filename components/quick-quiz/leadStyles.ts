import type { LeadTemperature } from '@/lib/quick-quiz/types'

// Colours for the Hot / Warm / Cold label, used by the brief and the team's
// sample list. Kept out of the screen files: a file that holds a screen should
// only share screens, or the dev server's live reload can lose shared values.
export const LEAD_STYLES: Record<LeadTemperature, string> = {
  hot: 'bg-navy text-frost',
  warm: 'bg-accent text-charcoal',
  cold: 'bg-charcoal text-frost',
}
