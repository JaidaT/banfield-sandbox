# Swatch Cards + the Room That Builds: Plan (2026-11-22)

**For:** Claude and Jaida. Behaviour first, so it also works in another repo; sandbox files and branches are in "In the sandbox" at the end.

**Status:** built in the sandbox on 2026-11-22; Jaida's phone check is still open.

**Builds on:** `SWATCH_CARDS_PLAN.md` (the card stack, pencil choices, the fall and "Calculating") and `ROOM_BUILD_PLAN.md` (the room that builds, "build-up-middle" layout). Everything in those plans still applies unless this file says otherwise.

## What it looks like

Top to bottom on every question card:

```
            [ the room that builds ]       <- centred
 [==========-----------------------------]  <- full-width progress bar
      +----------------------------+        <- next card peeking
   +--+----------------------------+--+
   | YELLOW STRIP: the question       |    <- active swatch card
   | answers, circled in pencil       |
   +----------------------------------+
   [   Back   ]  [   Next   ]
```

- **The room** sits centred above the bar, building up as in `"build-up-middle"`: one piece per finished screen, each piece growing from its own centre; Back shrinks the last piece away; a fade with reduced motion.
- **The wide room** (Jaida, 2026-11-23): redrawn at 3:1 (900 x 300, `public/3-1-room-assets/`) so it can be wide without being tall. The room takes its shape from its files, and its width is a setting, `"roomWidth"` in `data/quick-quiz/swatch-cards.json`: 60% of the bar's width on a phone and a computer (about 206 x 69px on a 375px phone, 318 x 106px on a computer). Left out, it falls back to 25% and 40%. The 4:3 room stays in `public/room-assets/` for the room progress branch. This replaces the "about 25% on a phone, 40% on a computer" sizes above.
- **Inside the iframe on a phone, always compact** (found measuring in Chrome, 2026-11-23): the short-screen layout switched on by the iframe's own height, so a card that pushed the iframe past 700px lost the compact layout and grew more. Inside the iframe on a phone it is now always compact. The minimum heights were re-measured: **715px on a phone, 960px on a computer** (tallest cards 703px and 947px), and the iframe holds one height on every card.
- **"Powered by Foyer." footer** (Jaida, 2026-11-23): small, centred, muted grey, "Foyer." in bold, the last thing on every Quick Quiz screen (cards, Calculating, result) except the welcome card (`WELCOME_MASCOTS_PLAN.md`, 2026-11-23). It sits inside the quiz's main area, so on `/quiz` it is at the bottom edge on short screens and inside the website's iframe it is at the bottom of the frame (counted in the iframe's height).
- **"Thank you!" stands alone** (Jaida, 2026-11-23): the line under it ("You may now exit this screen.") is left out, since "Powered by Foyer." is the footer right below. The line is optional in `data/quick-quiz/client-result.json` (`thanks.text`): add it back to show one.
- **No progress bar on the result** (Jaida, 2026-11-23): the result shows the finished room on its own, centred, with no bar and no "Questionnaire complete 100%" line. "Calculating" still shows the room above the full bar.
- **The order is shifted** (Jaida, 2026-11-22): the room **starts with the rug** on question 1 and gains one piece per card, so the contact card shows all 13 pieces (plants included) and nothing new arrives during "Calculating". **The walls and floor (`00-base.svg`) are the finishing touch on the result**: they fade in behind the furniture (about 500 ms; a quick fade with reduced motion). This replaces "the plants pop in during Calculating" below.
- **No empty room behind the pieces** (Jaida, 2026-11-22): `00-base.svg` is left out on the cards and during "Calculating", so only the furniture shows; it arrives on the result (see above).
- **The strip colour is switchable** (Jaida, 2026-11-22): `"strip"` in `data/quick-quiz/swatch-cards.json` is `"yellow"` (the brand yellow, dark text) or `"navy"` (the brand navy with off-white question and help text; on now). The leaving card and the cards falling away at the end match it.
- **The progress bar** is the room version's bar: full width, white track, yellow outline, yellow fill, no percentage text; screen readers hear "Question N of M". It replaces the swatch cards' grey bar with "N%".
- **Size:** about **25% of the width on a phone** (smaller than `"build-up-middle"`, so the room, bar, card and buttons still fit on one screen) and **40% on a computer**. Tune by eye.
- **Short screens (700px tall or less)** get a compact layout (Jaida tested on a 667px phone, 2026-11-22): the next card peeks about 16px instead of 32px, a smaller question with less padding in the strip, and less space between the room, bar, card and buttons (about 50px saved in all). The room's size and the 44px answer rows stay. Taller screens are unchanged.
- **After each move, the room stays in view.** Found in testing: moving the cursor to the new question made the browser scroll just enough to show it, leaving the room scrolled out of view above. Now the cursor moves without that scroll, and the quiz scrolls its own top (the room) into view if it is above the screen. Inside the website's iframe, the website's script does the scrolling instead. **Touch screens only** (Jaida, 2026-11-22): with a mouse or trackpad (the browser's "hover: hover and pointer: fine"), neither the quiz nor the website's script scrolls, so the page does not jump on a computer.
- **Inside the website's iframe, a minimum height** (Jaida, 2026-11-22): the iframe fits the quiz's height, so it grew and shrank with every card (each has a different number of answers). With `"embedMinHeight"` in `data/quick-quiz/swatch-cards.json` (715px on a phone, 960px on a computer: just above the tallest card, re-measured in Chrome on 2026-11-23), the quiz is at least that tall inside the iframe, and shorter cards leave space above the buttons instead. **Lowered by Jaida on 2026-11-23 to 650px on a phone and 850px on a computer**: less empty space on short screens, but the iframe grows on the tallest cards (up to about 703px and 947px) and shrinks back after them. `null` switches it off. **The welcome screen** was left out at first (Jaida, 2026-11-22); since 2026-11-23 it has the same height as the other screens (`WELCOME_MASCOTS_PLAN.md`). The quiz on its own page is unchanged.
- **The cards** work exactly as in `SWATCH_CARDS_PLAN.md`. The room and bar stay still while the cards swing and slide.

## The ending

1. "See my results": the cards fall away, as now.
2. **The room and the bar stay at the top.** The bar shows 100% (built: it appears full, rather than filling up), and the **last piece (the plants) pops in**, completing the room, while "Calculating your Design DNA . . ." shows below.
3. After 2 seconds the result appears: the complete room centred above the full bar (no second pop), then the result as now.

With reduced motion: the plants fade in, and the bar does not animate.

## Rules

- Only the "build-up-middle" layout is in this version: no placement setting, no other room versions.
- Everything from both plans that is not about layout still holds: all pieces load when the quiz opens and stay on the page; one move at a time for the cards; the questions, scoring and result do not change; the room is decoration, hidden from screen readers.
- The room must not move or redraw when a card moves: only the newly earned piece animates.

## Phases

Work test-first; motion and looks are checked by eye.

### Phase 1: Bring the room in
- [x] Copy the room that builds into this branch: the assets, the piece list with centres and its checks, the room component, and the pop-in animation (not the placement setting or the other room versions)
  - Tests: the piece list's existing tests pass here

### Phase 2: The room and bar on the cards
- [x] The card screen shows, in order: the room (centred), the room version's bar (full width, no percentage, "Question N of M" for screen readers), then the card stack
- [x] The room has the earned pieces for the current card: none on question 1, 12 on the contact card
- [x] About 25% wide on a phone, 40% on a computer
  - Tests: question 1 shows only the empty room; question 5 shows four pieces; the contact card shows 12; no percentage text; "Question N of M" is there; the room comes before the bar, and the bar before the card; the room is hidden from screen readers

### Phase 3: Moving between cards
- [x] Next adds one piece and Back removes one, while the cards move; the room's pictures stay the same on the page
  - Tests: Next adds exactly one shown piece, Back removes one, and no room picture is re-added; a second tap during a card move still does nothing

### Phase 4: The ending
- [x] During "Calculating your Design DNA", the room and the full bar stay at the top and the plants pop in
- [x] The result shows the complete room centred above the full bar, with no second pop
  - Tests: during calculating, all 13 pieces show and the plants have the pop-in; the result shows all 13 pieces with no pop-in; the calculating pause and result tests from the swatch cards still pass

### Phase 5: Checks
- [x] Every existing test still passes
- [x] Type check, lint, tests and build: all pass
- [x] Leave out the empty room everywhere: only the pieces show (Jaida, 2026-11-22)
  - Tests: no empty room on the cards, during "Calculating" or on the result
- [x] A strip colour setting: yellow, or navy with off-white text (on now)
  - Tests: the real file uses navy; yellow and navy load, yellow by default, anything else is refused; the card strip is navy with off-white question and help; the falling card matches
- [x] After each move, keep the room in view: move the cursor without the browser's scroll, then scroll the quiz's top into view if needed (not inside the iframe)
  - Tests: the cursor still moves to the new question; the quiz scrolls when its top is above the screen and not when it is in view; other forms still let the browser scroll
- [x] A compact layout for screens 700px tall or less: smaller peek, strip and gaps
- [x] A minimum height inside the iframe, switchable (embedMinHeight)
  - Tests: the real file sets 680 and 960; null or left out switches it off; bad values are refused; the quiz carries the two heights for the iframe rule
- [x] No automatic scrolling with a mouse or trackpad, on the quiz's own page and on the website; touch screens keep it
  - Tests: with a mouse, neither the quiz nor the website script scrolls; on a touch screen both still do
- [x] The welcome screen keeps its own height in the iframe (measured in Chrome: 258px on a phone, 230px on a computer; the cards stay at the minimum)
  - Tests: the welcome screen carries the mark; question cards do not
- [x] Start with the rug; the walls and floor fade in behind the furniture on the result; nothing new during "Calculating"
  - Tests: question 1 shows the rug, question 5 five pieces, the contact card all 13 with no walls and floor; nothing pops during "Calculating"; the result adds the walls and floor behind the pieces with the fade-in
- [x] Remove the progress bar and its "Questionnaire complete 100%" line from the result; keep the finished room
  - Tests: no bar or "Questionnaire complete" on the result, with or without the room
- [x] "Powered by Foyer." at the bottom of every screen (a footer option on the shared form, last inside the main area)
  - Tests: the shared form shows a given footer last in its main area, and none when not given; the quiz footer reads "Powered by Foyer." with "Foyer." bold and is last on the welcome screen, a card, Calculating and the result
- [x] No line under "Thank you!": the line is optional in the wording file, and left out
  - Tests: the result has no line under "Thank you!"; the wording file accepts no line, refuses a blank one, and still requires the title
- [x] The wide (3:1) room: new files, centres re-measured, the room's shape read from its files, a roomWidth setting (60% now)
  - Tests: the room uses the 900 x 300 files and every file has that artboard; the room's shape is 900 / 300; roomWidth loads, falls back to 25/40 and refuses bad values; the room carries both widths
- [x] Inside the iframe on a phone, always the compact layout; minimum heights re-measured (715px / 960px)
- [x] Jaida lowered the minimum heights to 650px / 850px (2026-11-23); tests updated
- [ ] Jaida tries it on a phone (does everything fit?) and a computer, with reduced motion, and on the stand-in website

## Decisions (2026-11-22)

- Room centred above a full-width bar, above the card stack (Jaida).
- Smaller room on phones (about 25%) so the card still fits (Jaida chose "smaller on a phone"; the size is Claude's starting point).
- The room version's bar replaces the swatch cards' bar, since the room belongs with it (Claude, following "build-up-middle").
- The plants pop in during "Calculating"; the result shows the room already complete (Jaida).
- Only "build-up-middle" in this version (Jaida).

## In the sandbox

- **Branch:** `foyer-v1-swatch-rooms`, made from `foyer-v1-swatch-cards` on 2026-11-22. `foyer-v1-swatch-cards` and `foyer-v1-room-progress` stay untouched.
- **From `foyer-v1-room-progress`, copy only:** `public/room-assets/`, `data/quick-quiz/room-build.json`, `lib/quick-quiz/roomBuild.ts` and its test, `components/quick-quiz/BuildUpRoom.tsx`, and the `piece-pop` animation in `app/globals.css`. Not the `progressBar` option on the shared form or `RoomProgressBar.tsx`: the swatch card screen already draws its own bar, so the room and bar go straight into `components/quick-quiz/SwatchCardScreen.tsx`, with no shared-form change.
- **Ending:** `Calculating` and `QuizResults` in `components/quick-quiz/QuizForm.tsx`, and the complete bar in `components/quick-quiz/ClientResultView.tsx`.
