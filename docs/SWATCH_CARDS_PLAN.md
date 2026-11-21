# Quick Quiz Swatch Cards: Implementation Plan (2026-11-20)

**For:** the development team building the Quick Quiz in any codebase. This file stands on its own: it describes what to build and how it should behave, not where the code lives. Planned on the `foyer-v1-swatch-cards` branch of the Banfield sandbox and written to be copied into another repo.

**Status:** plan only. Nothing is built yet.

## Why

Feedback on the Quick Quiz: the quiz itself is boring. The idea (Jaida, 2026-11-20): show each question as a card that looks like an interior designer's fabric swatch card, stacked like a deck, and make moving through the quiz feel like flipping through swatches.

## What the person sees

### The welcome screen
Stays a normal screen, not a card. "Let's start" opens the first card.

### The card
Every quiz question, and the contact screen at the end, is one card.

```
+----------------------------------------+
| YELLOW STRIP                           |
| The question, written across the strip |
| (the card's heading)                   |
+----------------------------------------+
|                                        |
| SWATCH AREA                            |
| The answer choices, slider, text box   |
| or contact fields                      |
|                                        |
+----------------------------------------+
```

- **Yellow strip at the top** (the brand yellow, `#FFCB49`) holds the question, written across (not sideways). It is the card's main heading. Dark text on the yellow, for contrast.
- **Swatch area** below it holds the answers, whatever the question type: choices, the slider and "Not sure yet", the long-text box, or the contact fields.
- **No fabric texture or colour for now.** The swatch area is plain. Texture is a later idea.
- Rounded corners and a thin light-grey border, like the mockup.

### Choosing an answer: the pencil circle
For one-choice and pick-several questions (Jaida, 2026-11-20). The look should be like someone **circling their favourite option with a pencil**.
- Each option is plain text in the swatch area, with no box or tick box drawn around it.
- **Hover** (mouse, or keyboard focus): a hand-drawn pencil circle appears around the option at **low opacity**, like a faint sketch.
- **Chosen**: the same circle at **full opacity**.
- **Pick several:** each chosen option gets its own circle. When the "pick up to" limit is reached, the other options fade and can't be chosen until one is un-circled, the same rule as today.
- **Pick one:** choosing another option moves the circle to it.
- **The circle is a drawn shape, slightly uneven, like real pencil.** Proposed (Claude, to approve): it draws itself in a quick stroke (about 300 ms) when chosen; with reduced motion it simply appears. A few slightly different circle shapes, so the options don't all look stamped.
- **Underneath, the options are still real radio buttons and tick boxes**, hidden from view but used by keyboards and screen readers, so the quiz works exactly as before.
- **Keyboard focus** shows the faint circle plus a clear focus outline, so keyboard users can always see where they are.
- *The exact look follows Jaida's screenshot (still to be shared again: it did not come through on 2026-11-20).*

### The other inputs: the same pencil feel
Claude's proposals, matching the hand-drawn pencil look (Jaida asked to match the vibe; to approve):
- **"Not sure yet"** (with the slider): circled in pencil when chosen, like the options.
- **The slider:** a hand-drawn pencil line for the track and a hand-drawn dot for the handle; the amount above it in the same writing style as today.
- **Text boxes** (long text, contact name and email): no box, just a pencil underline to write on, like a form on paper. The underline darkens when the box is in use. A box with a problem gets a red pencil underline and its message.
- **Back, Next and "See my results"** keep their current look, so they stand apart from the answers.

### The stack
```
      +------------------------------+     <- next card: about 40px showing,
   +--+------------------------------+--+     slightly narrower, behind
   |                                    |
   |          ACTIVE CARD               |
   |                                    |
   +------------------------------------+
```
- Only the **next** card peeks out, about 40px above the active card and a little narrower, as if it sits just behind.
- The last card (contact) has no card peeking behind it.
- **Progress** (the percentage and yellow bar) stays above the stack.
- **Back and Next** stay in a row below the stack.

### Moving forward (Next, or tapping the peeking card)
1. The active card swings **up and around to the back** of the stack (the curved arrow in the mockup).
2. The peeking card **slides down and forward** into the active place.
3. A new card appears peeking behind it (if there is one).

Tapping the peeking card does exactly what Next does.

### Moving back (Back)
The reverse: the card at the back comes **up, around and forward** to the front, and the active card **slides back** to the peeking position.
- Back on the first card returns to the welcome screen (no card motion needed).

### The last card
- The last card is the contact screen.
- Its main button says **"See my results"** (the same words as today). There is no "Submit" label.
- If contact details are required and something is missing, the card stays put and shows its problem messages, like any blocked Next.

### After "See my results"
1. All the cards **fall down out of the quiz's area**.
2. Behind them, the background shows **"Calculating your Design DNA"** with three dots that appear one by one (`.`, `. .`, `. . .`, repeating).
3. After **2 seconds**, the person's Design DNA result appears.

When the quiz sits in an iframe on a website, the cards fall out of the quiz's own box, not the whole web page.

## Rules

- **The quiz's questions, answers, scoring and result do not change.** Only how the screens look and move.
- **Reduced motion:** when the person's device asks for less motion (`prefers-reduced-motion`), cards **fade** instead of swinging, sliding or falling. The "Calculating" dots stay still (show `. . .`), and the 2-second wait still happens.
- **One move at a time:** while cards are moving, extra taps on Next, Back or the peeking card are ignored, so a fast double-tap never skips a question.
- **Only the active card can be used.** The peeking card is one big button. Everything else on the back cards is hidden from screen readers and can't be reached with Tab.
- **The peeking card's button** has a clear name for screen readers, such as "Next question".
- **After each move, the cursor goes to the new card's question,** as the quiz does today, so screen readers announce the new question.
- **"Calculating your Design DNA" is announced** to screen readers (a polite live region), and then the cursor moves to the result's main heading.
- **Phone first:** the stack fits a phone screen with no sideways scrolling. On a computer it is a centred column.
- **In an iframe:** if the website sizes the iframe to the quiz's height, the quiz's height should not jump around while cards move. Keep the stack's height steady during a move, and let it change only once the move has finished.
- **No new animation library is needed.** CSS transitions or the browser's built-in animation tools (the Web Animations API) are enough. If the codebase already uses one, that is fine too.

## Timings (starting points; tune by eye)

| Motion | Length |
|---|---|
| Next or Back card swap | about 400 ms |
| Cards falling away | about 600 ms |
| "Calculating your Design DNA" | 2 seconds (fixed) |
| Each dot appearing | about 400 ms per step |
| Reduced-motion fade | about 150 ms |

## Phases

Work test-first: for each step that changes what shows or what happens, write the failing test, then the code. Motion itself is checked by eye.

### Phase 1: Card state
- [ ] Keep track of which card is active, which one comes next, and which way the last move went (forward or back), using the quiz's existing step order and answers
- [ ] A "moving" flag that is on while a card swap or the fall is playing, and ignores Next, Back and peeking-card taps while on
  - Tests: Next moves to the next card; Back moves to the previous one; Back on the first card returns to the welcome screen; a tap while moving does nothing

### Phase 2: The card and the stack (no motion yet)
- [ ] The card: yellow strip with the question as the heading, plain swatch area with the answers, rounded corners and a thin border
- [ ] Every question type fits in the swatch area: one choice, several choices (with "pick up to"), the slider with "Not sure yet", long text, and the contact fields
- [ ] Choices as plain text with the pencil circle: faint on hover and keyboard focus, full when chosen, one circle per chosen option on pick-several, the others faded at the "pick up to" limit; real radio buttons and tick boxes underneath
  - Tests: choosing an option still records the same answer as today; on pick-several, the limit still stops a third choice; each option can be chosen with the keyboard alone
- [ ] The pencil feel for the other inputs: circled "Not sure yet", the hand-drawn slider, and underlined text boxes (once approved)
- [ ] The stack: the active card in front, the next card peeking about 40px above and slightly narrower; no peeking card on the last card
- [ ] Progress above the stack; Back and Next below it
- [ ] The welcome screen stays a normal screen
- [ ] The peeking card is a button named "Next question" that does what Next does; the back card's contents are hidden from screen readers and Tab
  - Tests: each question shows as a card with its question as the heading; the next card's button is there except on the last card; pressing it moves forward; nothing on the back card can be reached with Tab

### Phase 3: Card motion
- [ ] Next and the peeking card: the active card swings up and around to the back while the next card slides down and forward
- [ ] Back: the reverse
- [ ] Reduced motion: a short fade instead
- [ ] The pencil circle draws itself when an option is chosen (if approved); with reduced motion it simply appears
- [ ] The cursor moves to the new card's question once the move ends
- [ ] In an iframe that sizes to the quiz, the height stays steady during a move
  - Tests: after a move, the new question has the cursor; with reduced motion turned on, moves still work (and finish straight away in tests)

### Phase 4: The ending
- [ ] The contact screen is the last card; its button says "See my results"; a blocked "See my results" shows the problems on the card without any motion
- [ ] "See my results": the cards fall out of the quiz's area (a fade with reduced motion)
- [ ] The "Calculating your Design DNA" screen with dots appearing one by one, announced to screen readers; still dots with reduced motion
- [ ] After 2 seconds, the Design DNA result appears and the cursor moves to its main heading
  - Tests (using a pretend clock): "See my results" shows "Calculating your Design DNA"; the result is not there before 2 seconds and is there after; the result is the same one the quiz gives today; a blocked "See my results" shows the problems and no calculating screen

### Phase 5: Checks
- [ ] Every existing quiz test still passes (answers, scoring, result, contact rules)
- [ ] Run the project's type check, lint, tests and build: all pass
- [ ] Try it on a phone and a computer: forward, back, tapping the peeking card, a fast double-tap, the fall, the calculating screen, the result
- [ ] Try it with reduced motion turned on (phone accessibility settings, or the browser's developer tools)
- [ ] Try it inside the website iframe, if the quiz is embedded

## Decisions (2026-11-20)

- **Only the next card peeks** (Jaida chose one, unless there was reason for more; one keeps the phone screen calm and the motion easy to follow).
- **The welcome screen is not a card; the contact screen is** (Jaida).
- **The question sits across a strip at the top**, not sideways as on a real swatch card, so long questions stay readable on a phone (Jaida). **The strip is the brand yellow** (Jaida, changed from white on 2026-11-20).
- **Choices are circled in pencil**: a faint circle on hover, a full one when chosen (Jaida). The other inputs follow the same hand-drawn feel (Claude's proposals, to approve).
- **No fabric texture yet** (Jaida).
- **"See my results" stays** as the last button's words; no "Submit" (Jaida).
- **"Calculating your Design DNA" shows for 2 seconds with animated dots** (Jaida). It is a pause for effect: the result is already worked out.
- **Reduced motion gets fades** instead of swings, slides and falls (Jaida).
- **No new animation library** (recommended): the motions are simple enough for CSS or the browser's own animation tools, and it keeps the quiz small inside an iframe.

## Open questions (not blocking)

- Jaida's screenshot of the pencil circle (did not come through; needed for the circle's exact look).
- Claude's pencil proposals for the other inputs, and whether the circle draws itself.

- What the swatch area looks like without texture (plain white, the background colour, or a soft tint).
- Whether the peeking card should show a hint of the next question in its 40px, or stay blank like the mockup (the plan follows the mockup: blank).
- Fabric textures or colours per card, later.

## Later (not in this plan)

- Fabric textures or a different swatch colour per card
- Sound or vibration on card moves
- Swiping cards with a finger
