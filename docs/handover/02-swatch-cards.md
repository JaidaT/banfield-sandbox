# Handover 2 of 4: Swatch cards

**For:** the production team and its Claude agent (`foyer_prod`).
**Build order:** after handover 1 (groundwork). Before 3 (the room that builds) and 4 (welcome screen and mascots).

**The idea:** the short quiz felt boring. Each question, and the contact screen at the end, becomes a card that looks like an interior designer's fabric swatch card, stacked like a deck. Moving through the quiz feels like flipping through swatches. **The questions, answers, scoring, saving and result do not change.** Only how the screens look and move.

## Expects (check before starting; if any is different, stop and flag it)

- Handover 1 is done: `config.look` exists, the footer shows, focus moves without the browser scroll, and the quiz sends "new screen" inside an iframe.
- `ShortQuestionnaire` screens: `"welcome"`, question index `0..n-1` (one question per screen), `"contact"` (always last), then `"result"`.
- Question kinds: `single`, `multi` (with optional `maxSelections`), `long_text`, `range` (a slider with "Not sure yet" style options).
- **No question is required.** Production shows a "Skip" button when an answer is empty. **This handover replaces it:** the button always says **"Next"**. Skipping is still allowed and is still recorded exactly as now, so the skip signal still works.
- The result comes from a server action (`app/short-questionnaire/actions.js`), so it takes some time to arrive.
- `QuestionInput` (with `RangeField` inside it) draws the `long_text`, `range` and contact inputs. This handover **does not change their props**: it only restyles their inputs from the outside, inside the card (see "The other inputs"). The selectors there assume production's markup: a `<textarea>`, `<input type="text">`, `<input type="email">`, `<input type="tel">` and `<input type="range">`, and the escape options as `<button aria-pressed>`. If the markup differs, flag it and adjust the selectors, not the props.
- `ChoiceList` and `Option` stay as they are. The card uses a new component for choices (see "Pencil choices").
- Brand colours (use production's tokens if the values match, otherwise add them): frost `#f1efe7` (page background), charcoal `#414040` (text), navy `#04355d`, yellow `#ffcb49`, line `#e4ddca` (light borders), pencil `#5a5a5a`, light pencil `#b9b6ae`.

## New components and their contracts

| Component | Props | What it does |
|---|---|---|
| `SwatchCardStack` | `screen` (the current question index or `"contact"`), `children` (the active card's content), `title` (the active card's heading text), `help` (optional), `isLast`, `onNext`, `onBack`, `headingRef`, `strip` (`"yellow"` or `"navy"`) | The stack: the peeking next card, the active card, the card on its way out, and the Back/Next row. It owns the move animation and ignores taps while a move plays. |
| `PencilChoices` | `question` (`single` or `multi`), `value`, `onChange` | One-choice and pick-several answers, circled in pencil. Real radio buttons or tick boxes underneath. |
| `Calculating` | `strip` | "Calculating your Design DNA" with the cards falling away. |

These are names for the handover. Rename them to fit production's conventions, but do not reuse `Card`, `ChoiceList` or `Option` for them.

## One new setting (in `swatch-cards.json`, passed as `config.look.strip`)

| Field | Type | Now | Left out | Refused |
|---|---|---|---|---|
| `strip` | `"yellow"` or `"navy"` | `"navy"` | `"yellow"` | anything else |

- **`"navy"`:** strip `#04355d`, question text frost `#f1efe7`, help line frost at 85% opacity.
- **`"yellow"`:** strip `#ffcb49`, question text charcoal `#414040`, help line navy `#04355d`.

## What the person sees

### The page column
The cards sit in a centred column:
- **Width:** at most 576px.
- **Side padding:** 16px, or 24px from 640px wide.
- **Space between parts:** 24px, or 16px below 640px wide.
- **Top and bottom padding:** 24px, or 16px below 640px wide.

### The card
```
+----------------------------------------+
| STRIP: the question (the card heading) |
|        the help line, if any           |
+----------------------------------------+
| SWATCH AREA: the answers               |
+----------------------------------------+
```
- **Outside:** white, 16px rounded corners, a 2px border in line `#e4ddca`, content clipped to the corners.
- **Strip padding:** 12px top and bottom and 16px at the sides on a phone (below 640px); 24px and 32px from 640px.
- **The question** (the card's `h2`): bold, 18px (20px from 640px), line height 1.375, in the strip's text colour. It is the focus target after each move.
- **The help line** (for example "Pick up to two."): in the strip under the question, 14px italic. It is not repeated in the swatch area, and it is linked to the card with `aria-describedby`.
- **Swatch area padding:** 12px on a phone, 32px from 640px. 16px between items (20px from 640px).
- **The contact screen** is a card too. Its heading is the contact title, its intro (if any) is the first thing in the swatch area, then its fields.
- The card is a `<section>` labelled by its heading.

### Pencil choices (`single` and `multi`)
The look of someone circling their favourite option with a pencil.
- **Each option is plain text:** no box and no visible radio or tick box. The real `<input type="radio">` or `<input type="checkbox">` is inside the option's `<label>`, visually hidden (production's `.visually-hidden`), so keyboards and screen readers work as before.
- **Option rows:**
  - **On a phone:** at least 44px tall, padding 8px top and bottom and 16px at the sides, with 4px between options.
  - **From 640px:** at least 48px tall, padding 12px and 20px, with 12px between options.
  - The text has line height 1.375.
- **Hover or keyboard focus:** a faint pencil oval appears (30% opacity). Keyboard focus also shows a 2px navy outline, 2px out from the row.
- **Chosen:** the oval at full opacity, and the option's text **bold**. The oval draws itself in about 300ms. With reduced motion it simply appears.
- **Pick several:** each chosen option has its own oval. At the `maxSelections` limit, the other options turn off (40% opacity, not clickable, no oval), the same rule as today.
- **The group:** a `<fieldset>` whose `<legend>` (visually hidden) is the question, because the question is already the card's heading.
- **Production's option images:** if an option has one, it shows at 80 x 64px with 6px rounded corners, before the text.

**The oval** is an SVG laid over the option row, sticking out 4px at each side and 2px at the top and bottom:

```html
<svg viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true" class="oval">
  <path d="(one of the three paths below)" vector-effect="non-scaling-stroke" />
</svg>
```

Three slightly different paths, used in turn (option 1 gets the first, option 4 the first again), so the options don't look stamped:

```
M 46 7 C 120 1, 250 2, 290 20 C 302 34, 270 55, 150 57 C 60 58, 6 50, 6 32 C 6 14, 40 6, 92 4
M 60 5 C 150 0, 266 6, 292 24 C 300 42, 250 56, 140 56 C 52 56, 4 46, 8 28 C 12 12, 54 4, 104 5
M 40 9 C 110 2, 240 0, 288 18 C 304 32, 282 54, 160 58 C 70 60, 8 52, 5 34 C 3 16, 30 8, 84 6
```

```css
.oval { pointer-events: none; overflow: visible; opacity: 0; transition: opacity 150ms; }
.oval path {
  fill: none;
  stroke: #5a5a5a;
  stroke-width: 2;
  stroke-linecap: round;
  /* In screen pixels (the stroke does not stretch with the oval), longer than
     any oval, so the whole oval always shows at any width. */
  stroke-dasharray: 2000;
  stroke-dashoffset: 0;
}
@keyframes pencilDraw { from { stroke-dashoffset: 2000; } to { stroke-dashoffset: 0; } }
/* When chosen: */ .chosen .oval { opacity: 1; } .chosen .oval path { animation: pencilDraw 300ms ease-out; }
@media (prefers-reduced-motion: reduce) { .chosen .oval path { animation: none; } }
```

Found in testing: measuring the dash as a fraction of the path showed only part of the oval on wide screens. Keep it in screen pixels as above.

### The other inputs (same pencil feel; restyled from inside the swatch area)
These are plain CSS rules on the swatch area's descendants, using `:global()` for the tags inside `QuestionInput`.

- **Text boxes** (`text`, `email`, `tel`, `number`): no box. A 2px light-pencil `#b9b6ae` underline, no rounded corners, transparent background, 4px side padding. The underline turns pencil `#5a5a5a` when the box has focus. A box with a problem (`aria-invalid="true"`) gets a red `#c53030` underline.
- **The long-text box:** lines to write on, like paper, with no border:
  - background `repeating-linear-gradient(transparent 0, transparent 31px, #b9b6ae 31px, #b9b6ae 33px)`
  - line height 33px, padding `0 4px`
  - the lines turn `#5a5a5a` when it has focus.
- **The slider:**
  - **Track:** 3px tall, `#5a5a5a` up to the handle and `#b9b6ae` after it.
  - **Handle:** 24 x 22px, a 2px `#5a5a5a` border, filled yellow `#ffcb49`, with a slightly uneven hand-drawn shape: `border-radius: 50% 44% 54% 47%`.
  - The amount above the slider keeps its current look.
- **"Not sure yet" and the other escape buttons:**
  - **Normal:** no background and a transparent 2px border, oval corners (`border-radius: 50% / 50%`), padding 8px top and bottom and 20px at the sides.
  - **Hover:** the border turns pencil at 30% opacity.
  - **Chosen** (`aria-pressed="true"`): a full pencil border and bold text.
- **Back and Next** keep production's current button look (`Button`), so they stand apart from the answers.

### The stack
```
      +------------------------------+     <- the next card peeking above
   +--+------------------------------+--+     (16px narrower each side)
   |            ACTIVE CARD             |
   +------------------------------------+
   [   Back   ]  [   Next   ]
```
- **The next card peeks** above the active card: blank, white, the same border and corners, inset 16px at each side, 96px tall, with the active card 32px lower (40px from 640px wide). This gap is called "the peek" below.
- **The peeking card is a button**, named "Next question" for screen readers. It does exactly what Next does. On hover it lifts 4px. Keyboard focus shows a 3px navy outline, 2px out. Layering: peeking card `z-index: 5`, active card `10`, leaving card `30`.
- **The contact card** (the last) has no card peeking behind it.
- **The Back/Next row:** below the stack, 16px above it (24px from 640px), with 12px between the buttons. Each button takes half the width, and the row is pushed to the bottom when the card is short.
  - **Next:** "Next" on every card, or **"See my results"** on the contact card.
  - **Back:** shown on every card. Back on the first question returns to the welcome screen with no card motion.
- **One move at a time:** while a move plays, taps on Next, Back or the peeking card are ignored, so a fast double-tap never skips a question.
- **Only the active card can be used.** The leaving card is `aria-hidden="true"` and `inert`, with no pointer events.

### Moving between cards
- **Next, or tapping the peeking card:**
  - The active card swings up and around to the back of the stack, ending **behind** the peeking card.
  - At the same time, the peeking card slides down and forward into the active place.
  - A new card appears peeking behind it, if there is one.
- **Back:** the reverse. The card at the back comes up, around and forward to the front, while the active card slides back to the peeking place.
- **How it is built:** the new screen renders straight away as the active card, with an "in" animation. A copy of the old card (its strip and title only, absolutely placed over the stack from the peek down to the bottom) plays the "out" animation, then is removed when the move ends. The stack's height comes only from the active card, so the height does not jump during a move (this matters inside the iframe).
- **Lengths:** 400ms per move. With reduced motion, a 150ms fade (the old card fades out, the new one fades in) instead.
- **Focus** moves to the new card's heading when it shows, so screen readers announce the new question.

```css
/* --peek: 32px, or 40px from 640px wide (16px in the compact layout below).
   --move: the move's length (400ms, or 150ms with reduced motion). */
@keyframes cardOutForward {
  0%   { transform: none; z-index: 30; opacity: 1; }
  45%  { transform: translateY(-60%) rotate(-4deg); z-index: 30; opacity: 1; }
  55%  { z-index: 1; }
  100% { transform: translateY(calc(var(--peek) * -1)) scale(0.94); z-index: 1; opacity: 0; }
}
@keyframes cardInForward {
  from { transform: translateY(calc(var(--peek) * -1)) scale(0.94); }
  to   { transform: none; }
}
@keyframes cardOutBack {
  from { transform: none; z-index: 30; opacity: 1; }
  to   { transform: translateY(calc(var(--peek) * -1)) scale(0.94); z-index: 1; opacity: 0; }
}
@keyframes cardInBack {
  0%   { transform: translateY(-60%) rotate(-4deg); opacity: 0; }
  40%  { opacity: 1; }
  100% { transform: none; opacity: 1; }
}
@keyframes cardFade { from { opacity: 0; } to { opacity: 1; } }

.outForward { animation: cardOutForward var(--move) ease-in-out forwards; }
.inForward  { animation: cardInForward var(--move) ease-out; }
.outBack    { animation: cardOutBack var(--move) ease-in forwards; }
.inBack     { animation: cardInBack var(--move) ease-out; }
.fadeIn     { animation: cardFade var(--move) ease-out; }
.fadeOut    { animation: cardFade var(--move) ease-in reverse forwards; }
```

In tests (no `matchMedia`), the move length is 0, so moves finish straight away.

### Compact layout
This applies on screens 700px tall or less, and always inside the iframe below 640px wide. In the iframe, the iframe's own height says nothing about the phone: keying the compact layout to it made a tall card lose it and grow even taller (found measuring in Chrome).
- The peek: 16px.
- The column: 8px between parts, 12px top and bottom padding.
- The strip: 8px top and bottom padding.
- The question: 16px, line height 1.35.
- The Back/Next row: 8px above it.

The 44px answer rows stay. Taller screens are unchanged.

### After "See my results": "Calculating your Design DNA"
1. **The cards fall** out of the quiz's own area (not the whole web page). The fall area:
   - It is at least 320px tall, with content clipped.
   - It holds two blank white cards. The back one is inset 16px at each side and 288px tall. The front one is full width, 40px lower, 288px tall, with a 64px strip in the strip colour.
   - Each falls with `translateY(140%) rotate(9deg)` while fading out, over 600ms with `cubic-bezier(0.5, 0, 0.9, 0.5)`; the back card starts 60ms later.
   - With reduced motion, both fade out over 150ms.
2. **Behind them, "Calculating your Design DNA"** fades in: 20px, bold, centred, over 400ms after a 200ms delay.
   - **The dots:** three dots after the words appear one by one and repeat (`.`, `. .`, `. . .`). Each dot uses `@keyframes dot { 0%, 20% { opacity: 0 } 30%, 100% { opacity: 1 } }` over 1.6s, repeating, with delays of 0s, 0.4s and 0.8s. With reduced motion the dots stay still, showing `. . .`.
   - **Screen readers:** the text is in a `role="status"` element. The dots are `aria-hidden`.
3. **Then the result appears**, fading in over 400ms, and focus moves to its main heading. **When:** once the server's result has arrived **and** at least 2 seconds have passed since "See my results", whichever is later. A fast server still shows "Calculating" for 2 seconds, and a slow one keeps showing it until the result is there.
   - **If the server action fails:** keep production's current error handling, shown once the 2 seconds have passed. Flag it if there is none.

## Steps (test first: write the failing test, then the code)

- [ ] The `strip` setting in `swatch-cards.json`, through `config.look.strip`.
  - Tests: the real file gives `"navy"`; left out gives `"yellow"`; anything else is refused naming `strip`.
- [ ] The card: strip with the question as an `h2`, the help line in the strip (not repeated below), the swatch area, labelled `<section>`.
  - Tests: each question shows as a card headed by its prompt; the help line is in the strip and linked with `aria-describedby`; the strip carries the setting's colour.
- [ ] `PencilChoices` for `single` and `multi`.
  - Tests: choosing records the same answer value as today; on `multi`, the limit stops a further choice and turns the others off; each option can be chosen with the keyboard alone; the chosen option's text is bold; the real inputs are there but visually hidden.
- [ ] The other inputs restyled inside the swatch area (checked by eye; the answers they record do not change).
- [ ] The stack: the peeking "Next question" button (absent on the contact card), Back and Next below, "Next" always (never "Skip"), "See my results" on the contact card.
  - Tests: no "Skip" button with an empty answer; Next with no answer moves on and the answer is recorded as skipped, exactly as before; the peeking button moves forward; Back on question 1 shows the welcome screen; nothing on the leaving card can be reached with Tab.
- [ ] Moves: the out and in animations, the 150ms fade with reduced motion, one move at a time, focus on the new heading.
  - Tests: a second tap during a move does nothing; after a move the new heading has focus; with reduced motion moves still work.
- [ ] The compact layout (checked by eye on a 667px-tall phone and inside the iframe on a phone).
- [ ] "Calculating" with the falling cards and dots; the result once it has arrived and 2 seconds have passed.
  - Tests (pretend clock, with the server action stubbed): "See my results" shows "Calculating your Design DNA" in a status region; with the result back at once, the result is not shown before 2 seconds and is shown after; with the result arriving at 3 seconds, it shows at 3 seconds; the result is the same one production gives today; focus moves to the result heading.
- [ ] Every existing short quiz test still passes, apart from the ones about "Skip" and `scrollTo(0, 0)`, which change on purpose.
- [ ] Lint, tests and build pass. Try it on a phone and a computer: forward, back, tapping the peeking card, a fast double-tap, the fall, "Calculating", the result; and with reduced motion turned on; and inside the iframe.

## Decisions (from Jaida, in the sandbox)

- Only the next card peeks; the welcome screen is not a card; the contact screen is.
- The question sits across a strip at the top, not sideways as on a real swatch card, so long questions stay readable on a phone.
- The strip is navy now, switchable to yellow.
- Choices are circled in pencil, cleaner than a rough sketch; the other inputs follow the same hand-drawn feel.
- No fabric texture yet.
- "Next" on every card; questions stay optional.
- "Calculating" lasts until the result arrives, and at least 2 seconds.
- No new animation library: CSS keyframes and transitions are enough.
