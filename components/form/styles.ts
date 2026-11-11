// The plain grey wireframe look for the questionnaire, in one place.
// Change a style here and every questionnaire screen follows. Deliberately
// plain: the real look will be designed in Figma (see DECISIONS.md).

// Buttons: the main action (Next, Submit), other actions (Back), and small
// buttons inside a question (Add another, Remove, Edit).
export const BUTTON_MAIN = 'rounded border border-neutral-700 bg-neutral-800 px-5 py-2.5 text-base font-semibold text-white'
export const BUTTON = 'rounded border border-neutral-700 bg-white px-5 py-2.5 text-base font-semibold'
export const BUTTON_SMALL = 'rounded border border-neutral-500 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40'

// Text: screen headings, question labels, grey hints, and red problem messages.
export const HEADING = 'text-2xl font-bold outline-none'
export const LABEL = 'text-sm font-semibold'
export const HINT = 'text-sm text-neutral-600'
export const PROBLEM = 'text-sm font-semibold text-red-700'

// Text boxes.
export const INPUT = 'w-full rounded border border-neutral-400 bg-white px-3 py-2 text-base'
