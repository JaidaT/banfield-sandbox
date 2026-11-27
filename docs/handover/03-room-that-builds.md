# Handover 3 of 4: The room that builds

**For:** the production team and its Claude agent (`foyer_prod`).
**Build order:** after handovers 1 (groundwork) and 2 (swatch cards). Before 4 (welcome screen and mascots).

**The idea:** above the progress bar, a wide room furnishes itself as the person moves through the quiz: one piece of furniture per card. By the contact card the room is fully furnished. On the result, the walls and floor fade in behind the furniture as the finishing touch.

## Expects (check before starting; if any is different, stop and flag it)

- Handovers 1 and 2 are done: `config.look`, the swatch card stack, "Calculating", and the footer.
- **The short quiz has 12 questions, then the contact screen: 13 card screens in all.** The room has exactly 13 pieces, one per card screen. If production has a different number of questions, stop and flag it: the piece list has to change to match, and the quiz must refuse to start when the counts differ.
- `ProgressBar` (`value`, `label`: a yellow fill on a grey track) stays as it is. This handover adds a **new** bar component beside it.
- `ClientResultView` takes `result`, `complete = false` and `headingRef`. This handover **adds one optional prop**, `room`, and changes nothing else about its props. The short quiz passes `complete={false}`, so its "Questionnaire complete" bar does not show on the result. If `complete` does something else, flag it.

## Files to copy from the sandbox

Jaida copies these from the sandbox's `public/3-1-room-assets/` into production's `public/3-1-room-assets/`, keeping the names:

```
00-base.svg   01-rug.svg          02-big-shelf.svg   03-floor-lamp.svg   04-tv-stand.svg
05-wall-shelves.svg   06-chair.svg   07-pictures.svg   08-coffee-table.svg   09-tv.svg
10-clock.svg   11-love-seat.svg   12-shelf-stuff.svg   13-plants.svg
```

- **All 14 files are 900 x 300 (3:1)**, the same artboard (`viewBox="0 0 900 300"`).
- **Each piece is drawn in its final spot** on a transparent background, so the files stack exactly.
- **Drawing order:** later files sit on top of earlier ones.
- **`00-base.svg`** is the empty room (walls and floor). It only appears on the result.

## A new data file: `data/short-questionnaire/room-build.json`

It is read by `data.js` and checked by `parse.js`, like the other data files, and reaches the browser as `config.room`.

```json
{
  "_meta": { "...": "notes" },
  "width": 900,
  "height": 300,
  "base": "/3-1-room-assets/00-base.svg",
  "pieces": [
    { "name": "Rug", "file": "/3-1-room-assets/01-rug.svg", "centreX": 52.4, "centreY": 91.2 }
  ]
}
```

The 13 pieces, in order:

| # | Shows on | Name | File | centreX | centreY |
|---|---|---|---|---|---|
| 1 | Question 1 | Rug | 01-rug.svg | 52.4 | 91.2 |
| 2 | Question 2 | Big shelf | 02-big-shelf.svg | 90.6 | 47 |
| 3 | Question 3 | Floor lamp | 03-floor-lamp.svg | 8.9 | 54.8 |
| 4 | Question 4 | TV stand | 04-tv-stand.svg | 43.9 | 72.8 |
| 5 | Question 5 | Wall shelves | 05-wall-shelves.svg | 20.7 | 37 |
| 6 | Question 6 | Chair | 06-chair.svg | 27 | 75 |
| 7 | Question 7 | Pictures | 07-pictures.svg | 62.9 | 34.2 |
| 8 | Question 8 | Coffee table | 08-coffee-table.svg | 47.7 | 82.7 |
| 9 | Question 9 | TV | 09-tv.svg | 43.9 | 45.5 |
| 10 | Question 10 | Clock | 10-clock.svg | 44 | 16.5 |
| 11 | Question 11 | Loveseat | 11-love-seat.svg | 72.3 | 73.3 |
| 12 | Question 12 | Things on the shelves | 12-shelf-stuff.svg | 55 | 30.8 |
| 13 | Contact | Plants | 13-plants.svg | 45.7 | 44 |

`centreX` and `centreY` are the middle of each drawing, as a percentage of the room, measured from the files. A new piece grows from there.

**Checks** (the quiz refuses to start, with a message naming the problem):
- the number of pieces is not the number of card screens (questions + 1);
- a file is listed twice;
- a centre is outside 0 to 100;
- `width` or `height` is not above 0;
- a file path does not start with `/`.

## One new setting (in `swatch-cards.json`, passed as `config.look.roomWidth`)

| Field | Type | Now | Left out | Refused |
|---|---|---|---|---|
| `roomWidth` | `{ phone: number, computer: number }`, a percentage of the bar's width | `{ "phone": 60, "computer": 60 }` | `{ phone: 25, computer: 40 }` | a missing number, or a number outside 1 to 100 |

"Phone" means below 640px wide, and "computer" from 640px. At 60%, the room is about 206 x 69px on a 375px phone and about 318 x 106px on a computer.

## New components and their contracts

| Component | Props | What it does |
|---|---|---|
| `BuildUpRoom` | `room` (from `config.room`), `shownCount` (how many pieces show), `baseArrives = false` (the walls and floor fade in behind) | The stacked room. Decoration only. |
| `RoomProgressBar` | `room`, `roomWidth`, `shownCount`, `percent` (0 to 100), `label` (for screen readers) | The room centred above the outlined bar. |

`ClientResultView` gets the optional `room` prop: anything to show centred at the top of the result. With no `room`, nothing changes.

## What the person sees

### On every card
Top to bottom:
1. The room, centred.
2. The bar, full width.
3. The card stack from handover 2.

```
            [ the room that builds ]       <- centred, roomWidth wide
 [==========-----------------------------]  <- full width, 4px below the room
      +----------------------------+        <- next card peeking
   +--+----------------------------+--+
   | STRIP: the question              |
   +----------------------------------+
   [   Back   ]  [   Next   ]
```

- **The room:**
  - Its shape comes from `width` / `height` (3:1), and its width from `roomWidth`.
  - It has 8px rounded corners, with content clipped.
  - Every file is an `<img>` filling the whole room box, stacked in order.
- **The bar:**
  - 14px tall, full width, fully rounded, with a 2px yellow `#ffcb49` border and a white track.
  - The fill is yellow and fully rounded. Its width animates over 400ms ease-out, with no animation under reduced motion.
  - It has **no percentage text**.
- **How full:** question *n* of 13 is `round((n - 1) / 13 * 100)`%, so question 1 is 0% and the contact card is 92%.
- **Screen readers:**
  - They hear "Question *n* of 13" from a visually hidden line.
  - The room and the bar themselves are `aria-hidden="true"`.
- **The pieces:**
  - Question *n* shows pieces 1 to *n*: question 1 the rug, the contact card all 13.
  - **The walls and floor (`00-base.svg`) do not show on the cards**, only the furniture.

### How a piece arrives and leaves
- **All 13 pieces are on the page from the first card**, loaded straight away (`loading="eager"`), hidden until earned. Found when trying it: adding pictures mid-move made them pop in without their animation, because each had to load first.
- **A new piece** (Next) grows in from **its own centre** (`transform-origin: <centreX>% <centreY>%`):
  - from `scale: 0; opacity: 0` to `scale: 1; opacity: 1`,
  - over 300ms after a 100ms delay, with a slight bounce: `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- **On Back,** the latest piece shrinks into its centre over 200ms, `ease-in`.
- **With reduced motion:** a 150ms fade in or out, with no growing.
- **The room never redraws** when a card moves. Only the piece that changes animates, and the same `<img>` elements stay on the page throughout.

### "Calculating your Design DNA"
- The room (all 13 pieces) and the bar, now 100% full, stay at the top while the cards fall away below them.
- Nothing new arrives here.

### The result
- **No progress bar** and no "Questionnaire complete" line (`complete={false}`).
- **The complete room** sits centred at the top of the result: `roomWidth` wide, in `ClientResultView`'s new `room` slot, `aria-hidden="true"`.
- **The finishing touch:** the walls and floor (`00-base.svg`) fade in **behind** the furniture over 500ms after a 300ms delay. With reduced motion the fade is 150ms, with no delay.

```css
@keyframes roomPieceFade { from { opacity: 0; } to { opacity: 1; } }
.baseArrive { animation: roomPieceFade 500ms ease-out 300ms both; }
@media (prefers-reduced-motion: reduce) {
  .baseArrive { animation-duration: 150ms; animation-delay: 0ms; }
}
```

## Re-check the iframe heights
The room makes each card taller. After this handover, measure the tallest card in Chrome inside the iframe, on a 375px phone and on a computer. In the sandbox it was 703px and 947px, against minimums of 650/850 (handover 1). Tell Jaida the numbers if they differ.

## Steps

Production has no test runner. Each step ends with a **check by hand**: short steps to click through in `npm run dev` (or with the browser's developer tools where noted). The data checks in `parse.js` act as the automatic safety net: a bad settings or data file stops the app with a message naming the problem.

- [ ] Copy the 14 files. Add `room-build.json` with its checks in `parse.js`, through `config.room`.
  - Check by hand: the app starts. Temporarily delete one piece from the list: the app refuses to start, saying the count does not match. Put it back.
- [ ] The `roomWidth` setting, through `config.look.roomWidth`.
  - Check by hand: the room is a bit over half the bar's width. Set `"phone": 120`: the app refuses to start, naming `roomWidth`. Set it back to 60.
- [ ] `BuildUpRoom` and `RoomProgressBar` on every card, above the stack.
  - Check by hand: the room sits centred above a full-width outlined bar, above the card; question 1 shows only the rug, question 5 five pieces, the contact card all 13; there is no wall or floor behind the furniture; there is no percentage text; a screen reader hears "Question n of 13".
- [ ] Moves: Next adds one piece, Back removes one.
  - Check by hand: each Next grows one new piece from its own spot with a slight bounce; Back shrinks the latest one away; the other pieces never flicker or reload (developer tools, Network: no new image requests after the first card); a fast double-tap still moves only one card.
- [ ] "Calculating" and the result.
  - Check by hand: during "Calculating" all 13 pieces show and the bar is full; the result has no progress bar or "Questionnaire complete"; the result shows the complete room, and the walls and floor fade in behind the furniture.
- [ ] Re-measure the iframe heights (above).
- [ ] Lint and build pass. Try it on a phone and a computer, with reduced motion, and inside the iframe.

## Decisions (from Jaida, in the sandbox)

- The room centred above a full-width bar, above the card stack.
- A wide 3:1 room, so it can be wide without being tall; 60% of the bar's width.
- The room starts with the rug; one piece per card; all 13 by the contact card.
- No empty room behind the furniture on the cards; the walls and floor are the finishing touch on the result.
- No progress bar on the result, just the finished room.
- The outlined bar with no percentage replaces the plain grey bar on the short quiz (the long questionnaire keeps `ProgressBar`).
