# Quick Quiz "Room That Builds" Progress: Implementation Plan (2026-11-21)

**For:** the development team building the Quick Quiz in any codebase. This file stands on its own: it describes what to build and how it should behave, not where the code lives. Planned on the `foyer-v1-room-progress` branch of the Banfield sandbox, as a fourth version of the room progress bar, and written to be copied into another repo.

**Status:** built in the Banfield sandbox on 2026-11-21 (ticked steps); trying it on a phone is still open. In another repo, start from unticked.

## Why

Part of making the Quick Quiz less boring (team feedback). Earlier versions put one room graphic on the progress bar and swapped it on every screen. This version (Jaida, 2026-11-21) **builds one room up, piece by piece**: every finished screen adds a piece of furniture or decoration, so by the end the person has furnished a whole room.

## What the person sees

```
 Computer and phone (same split):

 +------------------------------+   +-----------------+
 | progress bar (about 60%)     |   |  the room       |
 |                              |   |  (about 40%)    |
 | ==========-------------------|   |  [ sofa ] [lamp]|
 +------------------------------+   +-----------------+
   bar lined up with the room's floor (bottom edge)
```

- **The bar is shorter:** about **60% of the width, on the left**. White track, yellow outline, yellow fill, rounded ends (as in the other versions). No percentage text.
- **The room sits to the right**, in the remaining **40%**, at its own shape (4:3). The bar lines up with the room's floor, at the bottom.
- **The same split on phones and computers.** On a phone the room is about 140px wide.
- **Screen readers** hear "Question N of M" (visually hidden), as in the other versions. The room is decoration: hidden from screen readers.

### The room builds up
- **Question 1:** the empty room (wall and floor).
- **Each finished screen adds one piece.** Question 2 shows the rug, question 3 adds the big shelf, and so on.
- **The contact screen** (the 13th screen) shows 12 pieces.
- **The result screen** shows the **complete room**: the last piece (the plants) arrives there.
- So the room always matches the bar: empty at 0%, complete at 100%.

### How a piece arrives
- **A new piece pops in where it belongs**: it grows from **its own centre** (not the room's), with the same slight bounce used elsewhere in the quiz (about 300 ms).
- **On Back**, the most recent piece **shrinks away** into its own centre (about 200 ms).
- **Reduced motion** (`prefers-reduced-motion`): a quick fade in or out, no growing.
- **All pieces are loaded when the quiz opens** and stay on the page, hidden until earned. Found in testing an earlier version: adding pictures to the page mid-change made them pop in without their animation, because each had to load first.

### The result screen
The "QUESTIONNAIRE COMPLETE 100%" bar keeps its 60/40 layout with the **complete room** beside it, the plants popping in as the last piece. This replaces the earlier "finished home" (three separate rooms) when this version is on.

## The pieces

All files are 600 x 450 (4:3), the same artboard, each piece drawn in its final spot on a transparent background, so they stack exactly. They are drawn in back-to-front order, so later pieces sit on top of earlier ones. Checked on 2026-11-21: stacked in order, the 13 pieces match the full picture exactly.

| Screen | Shows | File |
|---|---|---|
| Question 1 | The empty room (wall and floor) | 00-base.svg |
| Question 2 | + Rug | 01-rug.svg |
| Question 3 | + Big shelf | 02-bigshelf.svg |
| Question 4 | + Floor lamp | 03-floorlamp.svg |
| Question 5 | + TV stand | 04-tvstand.svg |
| Question 6 | + Wall shelves | 05-wallshelves.svg |
| Question 7 | + Chair | 06-chair.svg |
| Question 8 | + Pictures | 07-pictures.svg |
| Question 9 | + Coffee table | 08-coffeetable.svg |
| Question 10 | + TV | 09-tv.svg |
| Question 11 | + Clock | 10-clock.svg |
| Question 12 | + Loveseat | 11-loveseat.svg |
| Contact | + Things on the shelves | 12-shelfstuff.svg |
| Result | + Plants: the complete room | 13-plants.svg |

`full-picture.svg` is the finished room in one file. It is a reference for checking that the pieces stack correctly; the quiz itself uses the pieces.

**Each piece's centre** (where it grows from) is worked out from where the drawing sits on the artboard, and stored with the piece list, so the screen does not have to measure pictures.

## Rules

- **The quiz's questions, answers, scoring and result do not change.** Only the progress area.
- **Only the Quick Quiz.** The long questionnaire keeps its own bar.
- **Keep the piece list in a data file** (order, file, short name, centre point), so the team can reorder or swap pieces without touching code. The app should refuse to start if the number of pieces does not match the number of screens, a piece is listed twice, or a centre point is outside the room.
- **Every piece file exists and is the same size as the base** (checked by a test).
- **No new libraries:** CSS transitions are enough.

## Timings (starting points; tune by eye)

| Motion | Length |
|---|---|
| Fill growing or shrinking | about 400 ms |
| New piece growing in (with a slight bounce) | about 300 ms |
| Last piece shrinking away (Back) | about 200 ms |
| Reduced-motion fade | about 150 ms |

## Phases

Work test-first: for each step that changes what shows, write the failing test, then the code. Motion and looks are checked by eye.

### Phase 1: The pieces
- [x] Add the base, the 13 pieces and the full picture
- [x] Work out each piece's centre point from its drawing, and store it with the piece list in a data file (order, file, short name, centre)
- [x] Load it with checks: 13 pieces for 13 screens plus the result, no piece listed twice, centres inside the room
  - Tests: the real file loads in the order above; every file exists and has the base's size; a missing piece, a repeat or a centre outside the room stops the app with a message naming the problem

### Phase 2: The layout
- [x] A "build-up" version alongside the others: the bar about 60% wide on the left, the room about 40% on the right, lined up at the bottom, the same split on phones and computers
- [x] The room shows the base plus one piece per finished screen (none on question 1, 12 on the contact screen)
- [x] "Question N of M" for screen readers; the room hidden from them
  - Tests: question 1 shows only the base; question 5 shows the base and four pieces; the contact screen shows 12 pieces; the room is hidden from screen readers; the long questionnaire is unchanged

### Phase 3: Motion
- [x] All pieces on the page from the start, hidden until earned
- [x] A new piece grows from its own centre with a slight bounce; on Back the last piece shrinks into its own centre
- [x] Reduced motion: a quick fade, no growing
  - Tests: every piece is on the page from the first screen; Next adds exactly one shown piece, Back removes exactly one; the same pictures stay on the page (nothing is re-added)

### Phase 4: The result
- [x] The result's 100% bar keeps the 60/40 layout, with the complete room; the last piece pops in
  - Tests: the result shows all 13 pieces; the room is hidden from screen readers

### Phase 5: Checks
- [x] Every existing quiz test still passes
- [x] Run the project's type check, lint, tests and build: all pass
- [ ] Try it on a phone and a computer: the room building up, Back, the result
- [ ] Try it with reduced motion turned on
- [ ] Try it inside the website iframe, if the quiz is embedded

## Decisions (2026-11-21)

- **One piece per finished screen**: question 1 shows the empty room, the result the complete one, matching the bar (Jaida).
- **Pieces pop in from their own centre** with a slight bounce; Back shrinks the last one away; a fade with reduced motion (Jaida).
- **Bar about 60%, room about 40%**, the same on phones and computers (Jaida).
- **The complete room on the result**, replacing the three-room "finished home" for this version (Jaida).
- **Its own plan file** (Jaida); in the sandbox it is a fourth version of the room progress bar, switched by the same setting as the others.
- **Pieces are stacked full-size layers**, so each lands exactly where it belongs (asset guidance given 2026-11-21: one 600 x 450 artboard, each piece exported at the full artboard size).

## Open questions (not blocking)

- Whether the room reads clearly at about 140px wide on a phone, or needs to be bigger (a larger share for the room, or the room above the bar on phones).

## Later (not in this plan)

- Different rooms for different answers (for example, a kitchen for kitchen projects)
- Letting people tap a piece to see what it is
