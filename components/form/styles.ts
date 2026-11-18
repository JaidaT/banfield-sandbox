// The questionnaire's look, in one place. Change a style here and every
// questionnaire screen follows.
// Demo styling (2026-11-17, foyer-v1-demo-styling only): Banfield's yellow and
// navy, matching the team's screenshots. foyer-v1 keeps the plain wireframe.

// The button corner shape from the screenshots: sharp top-left and
// bottom-right, round top-right and bottom-left.
const CORNERS = 'rounded-tr-2xl rounded-bl-2xl'
const FOCUS = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-navy'

// Buttons: the main action (Next, Submit), other actions (Back), and small
// buttons inside a question (Edit, Remove, Favourite).
export const BUTTON_MAIN = `${CORNERS} ${FOCUS} border-2 border-accent bg-accent px-5 py-3 text-base font-semibold text-charcoal transition-colors hover:border-[#f2b92a] hover:bg-[#f2b92a]`
export const BUTTON = `${CORNERS} ${FOCUS} border-2 border-accent bg-transparent px-5 py-3 text-base font-semibold text-charcoal transition-colors hover:bg-accent/20`
export const BUTTON_SMALL = `rounded-lg ${FOCUS} border-2 border-accent bg-white px-3 py-1.5 text-sm font-semibold text-charcoal transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:bg-accent`
// A small button that adds something (Add member).
export const BUTTON_ADD = `${CORNERS} ${FOCUS} border-2 border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:bg-[#f2b92a] disabled:cursor-not-allowed disabled:opacity-40`

// Text: screen headings, question labels, hints, and red problem messages.
export const HEADING = 'text-2xl font-bold leading-tight text-charcoal outline-none'
export const LABEL = 'text-base font-semibold text-charcoal'
// Small and grey on the long questionnaire; italic navy on the Quick Quiz
// (its form sits inside a "quick-quiz" class).
export const HINT = 'text-sm text-neutral-500 in-[.quick-quiz]:italic in-[.quick-quiz]:text-navy'
export const PROBLEM = 'text-sm font-semibold text-red-700'

// Text boxes.
export const INPUT = `w-full rounded-xl border-2 border-[var(--line)] bg-white px-4 py-3 text-base text-charcoal placeholder:italic placeholder:text-neutral-400 outline-none transition-colors hover:border-accent/70 focus:border-accent ${FOCUS} aria-invalid:border-red-600`

// White rounded cards (Add another, picture sets, the review screen).
export const CARD = 'flex flex-col gap-3 rounded-2xl border-2 border-[var(--line)] bg-white p-4'

// The Back and Next row: pushed to the bottom of the screen on a short step,
// after the questions on a long one. Each button takes half the width.
export const BUTTON_ROW = 'mt-auto flex gap-3 pt-6 [&>button]:flex-1'
