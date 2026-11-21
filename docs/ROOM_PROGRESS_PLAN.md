# Quick Quiz Room Progress Bar: Implementation Plan (2026-11-21)

**For:** the development team building the Quick Quiz in any codebase. This file stands on its own: it describes what to build and how it should behave, not where the code lives. Planned on the `foyer-v1-room-progress` branch of the Banfield sandbox (separate from the swatch cards idea) and written to be copied into another repo.

**Status:** built and tried in the Banfield sandbox on 2026-11-21 (Jaida checked a phone and a computer, reduced motion and the stand-in website: no issues). Still open: choosing between versions 1, 2 and 3. In another repo, start from unticked.

## Why

The Quick Quiz should feel less like a form (team feedback: "the quiz itself is boring"). Jaida's idea (2026-11-21): as the person moves through the quiz, a small room illustration sits on the progress bar and changes on every screen, so the bar feels like walking through a home.

## What the person sees

```
                              [ room graphic ]
 +===========================================--------------------+
 |  yellow fill                              |  empty (white)     |
 +===========================================--------------------+
                                            ^ the graphic's right edge
                                              lines up with the end of the fill
```

- **The bar:** a white track with a yellow outline, filled with the brand yellow (`#FFCB49`) up to how far through the quiz the person is. Rounded ends.
- **The room graphic** sits on top of the bar. Its **right edge lines up with the end of the yellow fill**, so it travels right as the person goes through the quiz.
- **At the start** (the first question, 0% done) the graphic sits at the **far left** of the bar. It never hangs off either end.
- **Each screen has its own room** (see "Which room, when").
- **No percentage text** above the bar. Screen readers still hear progress (see Rules).
- **Only the Quick Quiz.** The long questionnaire keeps its own progress bar.

### Moving to the next or previous screen
- The old room **fades out quickly** (about 150 ms), and the new room **fades in a moment later** (after about 100 ms, over about 250 ms) as it slides along the bar with the yellow fill (which grows, or shrinks on Back). The two should barely overlap (Jaida, 2026-11-21).
- **Load every room once, when the quiz opens, and keep them all on the page**, showing only the current one. Found in testing: adding and removing the room pictures on each screen made them pop in and out (each had to load and draw before its fade could show) and overlap for most of the change.
- **Reduced motion** (`prefers-reduced-motion`): a quick fade only, with no sliding.

### The result screen
- The result already shows a "QUESTIONNAIRE COMPLETE" bar at 100%.
- **There is no graphic made for this screen.** Proposed (Claude, to judge on screen): a **"finished home"**: three of the rooms (living-sofa, dining-table, bedroom) lined up side by side along the full bar, as if the whole home is now furnished.

### Size
The graphics come in different shapes and sizes. Show them all at **one height** (their width follows their own shape), small enough to sit neatly on the bar and not crowd the question: about **56px tall on a phone and 72px on a computer** as a starting point. Tune by eye.

### Versions 2 and 3: the room at the far right, or in the middle (2026-11-21)
Jaida asked to try more versions. All are kept, chosen by one setting in the data file ("placement"), so the team can compare them.
- **Version 1, "follow-fill":** as above. The room's right edge follows the end of the fill and slides along; rooms fade between screens.
- **Version 2, "far-right": the room always sits at the **right end of the bar**, and the yellow fill grows towards it. Between screens the old room **shrinks down into the bar** (about 200 ms) and the new one **grows up from the bar** with a slight bounce (about 300 ms, starting about 150 ms later). Both scale from the bottom, so they seem to rise out of the bar.
- **Version 3, "middle"** (Jaida, 2026-11-21): the room always sits in the **middle of the bar**, with the same shrink-and-grow change as version 2. Rooms of different widths share one centre.
- **Version 4, "build-up"** (on now; Jaida, 2026-11-21): a shorter bar beside one room that gains a piece per finished screen. It has its own plan: `ROOM_BUILD_PLAN.md`.
- **Reduced motion:** no shrinking or growing; a quick fade.

## Which room, when

Thirteen graphics, one for each of the 13 screens (12 questions, then the contact screen). The order was left to the team ("whatever fits best"); this pairs rooms with questions where there is a natural link.

| # | Question (short) | Room file | Shows | Why this one |
|---|---|---|---|---|
| 1 | Big decisions | study-desk.svg | Desk, chair, lamp, shelf | Thinking things through |
| 2 | How involved | writing-desk.svg | Desk with laptop, lamp and plant | Hands-on planning |
| 3 | A different design | sitting-room.svg | Two chairs, table, art on the wall | Looking at something new |
| 4 | What gives confidence | reading-chair.svg | Chair, floor lamp, bookshelf | Reading up, feeling sure |
| 5 | Coffee | kitchen.svg | Kitchen shelves, coffee machine, fridge | The coffee machine |
| 6 | What home means | living-sofa.svg | Sofa under a pendant light | The heart of a home |
| 7 | Project type | dining-table.svg | Dining table and chairs | A room people renovate |
| 8 | When to start | window-sofa.svg | Sofa, window, wall clock | The clock |
| 9 | Investment | home-office.svg | Computer desk and chair | Working out numbers |
| 10 | Project stage | armchair.svg | Armchair, hanging plant, side table | Settling in |
| 11 | Type of help | vanity.svg | Vanity mirror and chair | Getting ready |
| 12 | Anything else | reading-nook.svg | Bean bag, shelf, side table | A cosy extra corner |
| 13 | Contact | bedroom.svg | Bed with framed picture | The end of the walk-through |
| Result | (100%) | living-sofa + dining-table + bedroom | Three rooms side by side | The finished home |

The graphics are flat illustrations (SVG), provided by Jaida as "Asset 11" to "Asset 44" and renamed by what they show. They are decoration: they carry no information the person needs.

**Keep the pairing in a data file** (question id to room file), not in the screen's code, so the team can swap rooms without touching code. The app should refuse to start if a question has no room, or a room file is missing.

## Rules

- **The quiz's questions, answers, scoring and result do not change.** Only the progress bar.
- **The graphics are decorative:** empty alt text and hidden from screen readers.
- **Screen readers still hear progress:** with the percentage text gone, keep a visually hidden line such as "Question 3 of 13" by the bar.
- **The graphic never covers the question** or pushes the page sideways: on a phone, the bar, the graphic and the question all fit across the screen with no sideways scrolling.
- **The bar and graphic stay at the top of each question screen**, where the percentage and bar are now.
- **No new libraries:** CSS transitions are enough.

## Timings (starting points; tune by eye)

| Motion | Length |
|---|---|
| Fill growing or shrinking | about 400 ms |
| Room sliding to its new spot | about 400 ms, with the fill |
| Old room fading out | about 150 ms |
| New room fading in | about 250 ms, starting about 100 ms after the old one starts fading |
| Reduced-motion fade | about 150 ms |

## Phases

Work test-first: for each step that changes what shows, write the failing test, then the code. Motion and looks are checked by eye.

### Phase 1: The rooms and their order
- [x] Add the 13 room graphics, named by what they show
- [x] A data file pairing each quiz question id (and the contact screen) with its room, plus the result's "finished home" rooms
- [x] Load it with checks: every screen has a room, no unknown question ids, every room file exists (checked by a test, since the app cannot read files in the browser), no room listed twice for the screens
  - Tests: the real file loads; the 13 pairs match the table above; a missing question, an unknown id, a missing file or a repeated room each stop the app with a message naming the problem

### Phase 2: The bar
- [x] The Quick Quiz's bar: white track, yellow outline, yellow fill, rounded ends; no percentage text; a visually hidden "Question N of M" for screen readers
- [x] The room graphic above the bar: one height for all, right edge at the end of the fill, never past either end (far left at 0%); decorative
- [x] Only the Quick Quiz gets this bar; the long questionnaire keeps its own
  - Tests: each question screen shows its own room; no percentage text shows; "Question N of M" is there for screen readers; the graphic is hidden from screen readers; the long questionnaire still shows "Step N of M"

### Phase 3: Moving between screens
- [x] On Next and Back, the fill grows or shrinks, the old room fades out, and the new room fades in and slides to its new spot
- [x] All rooms load once and stay on the page, with only the current one visible; the old room fades out fast and the new one fades in a moment later (fix after Jaida's test, 2026-11-21)
  - Tests: every room is on the page from the start and loads straight away; changing screens keeps the same pictures (nothing is re-added); only the current room is visible
- [x] Reduced motion: a quick fade, no sliding
  - Tests: after Next, the new room shows and the old one is gone once the move ends; Back shows the previous screen's room

### Phase 4: The result
- [x] The result's 100% bar shows the "finished home" rooms side by side (to judge on screen; easy to remove)
  - Tests: the result's bar shows the finished-home rooms; they are hidden from screen readers

### Version 2 steps
- [x] A "placement" setting in the data file ("follow-fill" or "far-right", default "follow-fill"); any other value stops the app with a message
- [x] Far-right: the room at the right end of the bar on every screen; the old room shrinks away and the new one grows in with a slight bounce; a fade with reduced motion
  - Tests: the real file uses far-right; both values load; another value throws; with far-right the room sits at the right end on every screen; with follow-fill it still follows the fill
- [x] Middle: a third "placement" value; the room in the middle of the bar on every screen, changing like far-right
  - Tests: the real file uses middle; all three values load; with middle the room sits in the middle on every screen; middle and far-right change rooms the same way, follow-fill fades
- [ ] Jaida compares the three versions and picks one (still comparing, 2026-11-21)

### Phase 5: Checks
- [x] Every existing quiz test still passes
- [x] Run the project's type check, lint, tests and build: all pass
- [x] Try it on a phone and a computer: every screen's room, forward and back, the result
- [x] Try it with reduced motion turned on
- [x] Try it inside the website iframe, if the quiz is embedded

## Decisions (2026-11-21)

- **Quick Quiz only** (Jaida).
- **One room per screen, 13 in all**, paired with questions where there is a natural link; the order was left to Claude (Jaida: "whatever fits best").
- **The room's right edge follows the end of the fill**, starting at the far left (Jaida's screenshots; Jaida confirmed the start).
- **White track with a yellow outline**, replacing the grey track (Jaida: "try it out").
- **No percentage text** (Jaida); a hidden "Question N of M" keeps progress for screen readers (Claude).
- **Fade and slide between rooms**, a fade only with reduced motion (Jaida).
- **A "finished home" on the result**, made from three existing rooms, because no graphic was made for it (Jaida wanted one; Claude's proposal for how).
- **The pairing lives in a data file**, so rooms can be swapped without code changes (Claude).

## Open questions (not blocking)

- Whether the "finished home" on the result works, or the result's bar should stay plain.
- A graphic made especially for the result, later.

## Later (not in this plan)

- Rooms that react to answers (for example, the kitchen only for people renovating a kitchen)
- Combining this with the swatch cards idea, if both are kept
