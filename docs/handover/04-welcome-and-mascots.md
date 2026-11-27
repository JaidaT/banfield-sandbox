# Handover 4 of 4: Welcome screen and mascots

**For:** the production team and its Claude agent (`foyer_prod`).
**Build order:** last, after handovers 1, 2 and 3.

**The idea:**
- **The welcome screen:** a swatch-card-style card with the Banfield logo, centred over slowly moving columns of the five Design DNA mascots and the logo.
- **The result:** the person's own mascot sits at the top of their Design DNA card.

## Expects (check before starting; if any is different, stop and flag it)

- Handovers 1 to 3 are done: `config.look`, the footer (hidden on the welcome screen), the iframe minimum height on every screen, and the swatch card look.
- `quiz-form.json` has `welcome: { title, intro }`, both strings, and `config.welcome` passes them through.
- "Let's start" on the welcome screen stores `performance.now()` in a ref, and the time is measured from that press. **This handover renames the button to "Get Started" and keeps that behaviour exactly.**
- `design-dna.json` profiles are `{ archetype, name, headline, description, help }`, with the names "The Curator", "The Explorer", "The Nest Builder", "The Strategist" and "The Visionary".
- `pickDesignDna()` copies only words into `result.designDna` (never the client type id). This handover adds one optional field, `mascot`, which holds only a file path and a picture description: no client type id.
- `ClientResultView` shows the Design DNA card as a section labelled by the profile name, with the label "DESIGN DNA", the name, the headline and the description.
- `Button` stays exactly as it is. The welcome button is `<Button variant="primary">`.

## Files to copy from the sandbox

Jaida copies these from the sandbox's `public/mascots/` into production's `public/mascots/`, keeping the names:

```
curator-capybara.svg   explorer-echidna.svg   nest-builder-nene.svg
strategist-seal.svg    visionary-vole.svg     banfield-logo.svg
```

- **None of them are square.** Each drawing includes the mascot's name, for example "Curator Capybara".
- **The logo** is wide: 400 x 81.
- **They are clean:** checked in the sandbox, with no scripts and no outside links.

## Wording changes (`quiz-form.json`, through `config.welcome`)

```json
"welcome": {
  "title": "Find your Design DNA",
  "intro": [
    "Discover how you approach projects, and how Banfield Design Co. can help bring your dream home to life.",
    "It takes about **5 minutes**, and there are no wrong answers."
  ],
  "button": "Get Started",
  "logo": { "file": "/mascots/banfield-logo.svg", "alt": "Banfield Design Co." }
}
```

| Field | Type | Rule |
|---|---|---|
| `title` | string | required, not blank (as now) |
| `intro` | string, or a list of strings | Each string is one paragraph. A single string is read as a one-item list. The list must not be empty, and no paragraph may be blank. `**text**` shows that text in bold. Refuse a paragraph whose `**` marks are not paired. |
| `button` | string, optional | not blank if given. Left out: "Let's start". |
| `logo` | `{ file, alt }`, optional | `file` starts with `/`; `alt` is not blank. Left out: no logo. |

The bold marking needs a tiny helper: split the paragraph on `**`; the odd-numbered parts are bold. Render them as `<strong>`. **Never** use `dangerouslySetInnerHTML` for this.

## New settings (in `swatch-cards.json`, passed as `config.look.welcome`)

```json
"welcome": {
  "animate": true,
  "opacity": 10,
  "pictures": [
    "/mascots/curator-capybara.svg",
    "/mascots/explorer-echidna.svg",
    "/mascots/nest-builder-nene.svg",
    "/mascots/strategist-seal.svg",
    "/mascots/visionary-vole.svg",
    "/mascots/banfield-logo.svg"
  ],
  "secondsPerSquare": 20,
  "squareSize": 150,
  "gap": 20
}
```

| Field | Type | Left out | Refused |
|---|---|---|---|
| `welcome` (the whole thing) | object or `null` | `null`: a plain background with no columns | not an object |
| `pictures` | list of paths starting with `/` | (required) | an empty list, or a path not starting with `/` |
| `secondsPerSquare` | number: how long a square takes to move its own height (bigger is slower) | (required) | 0 or below |
| `squareSize`, `gap` | numbers (pixels) | (required) | 0 or below |
| `animate` | true or false | `true` | anything else |
| `opacity` | number, a percentage | `100` | outside 1 to 100 |

## New components and their contracts

| Component | Props | What it does |
|---|---|---|
| `WelcomeCard` | `welcome` (from `config.welcome`), `onStart`, `headingRef` | The welcome card. `onStart` is what "Let's start" does now (it starts the clock and opens question 1). |
| `MascotBackground` | `look` (from `config.look.welcome`) | The moving columns behind the welcome card. Decoration only. |

`ShortQuestionnaire` renders `WelcomeCard` (and `MascotBackground` when `config.look.welcome` is not `null`) for the `"welcome"` screen, in place of the current welcome screen.

## The welcome card

```
 |  ^   |   v   |  ^   |   <- columns of mascots and the logo
 |   +------------------+ |    (middle column down, its neighbours up)
 |   |   BANFIELD.      | |   <- logo
 |   | Find your Design DNA |
 |   | Discover how you ... |
 |   | It takes about       |
 |   | 5 minutes, and ...   |
 |   | [   Get Started    ] |
 |   +------------------+ |
```

- **The card's shape** is the same as a swatch card (handover 2): white, 16px rounded corners, a 2px line `#e4ddca` border, and the same width (the page column's full width).
- **Inside the card:**
  - 16px padding on a phone, 32px from 640px wide, with 20px between items.
  - It sits on top of the background (`position: relative; z-index: 10`).
- **Position:** centred across and down in the page column. The column fills the window on the quiz's own page, and inside the iframe it is at least `embedMinHeight` tall (handover 1), so the card sits in the middle of that.
- **Top to bottom:**
  1. **The logo**, if given: centred, 160px wide on a phone and 192px from 640px, with height auto. Its `alt` is "Banfield Design Co.", and it shows at full strength (it does not fade with the columns).
  2. **The heading** (`h2`, the focus target): "Find your Design DNA", centred, bold, 18px (20px from 640px), line height 1.375, charcoal `#414040`.
  3. **The paragraphs:** 16px, line height 1.375, with the `**` parts in bold.
  4. **The button:** `<Button variant="primary">` with "Get Started", full width, 12px of extra space above it. Pressing it does exactly what "Let's start" does now.
- **No "Powered by Foyer."** on this screen (handover 1).

## The moving background (`MascotBackground`)

- **Where:**
  - `position: fixed; inset: 0` behind the card, so it fills the screen, or the iframe when embedded.
  - It uses `display: flex; justify-content: center; overflow: hidden`, with `gap` set to the `gap` setting.
  - The whole layer's `opacity` is `opacity / 100` (now 0.1).
- **Decoration only:** `aria-hidden="true"`, `pointer-events: none`, every `<img>` has `alt=""`, and nothing can be focused or reached with Tab.
- **15 columns**, an odd number so one sits in the middle behind the card. That is enough to fill a wide screen; the columns past the edges are cut off.
- **Each column** is `squareSize` wide (`flex-shrink: 0`).
- **Columns at an odd distance from the middle** start half a step higher. The step is `squareSize + gap`, so these columns get `margin-top: -(step / 2)`.
- **Direction:** the middle column moves **down**, and the columns either side alternate outwards: middle down, its neighbours up, the next ones down, and so on. In code: the distance from the middle is even for down, odd for up.
- **The pictures down a column** come from `pictures`, in turn. Column *i* starts at picture `(2 * i) mod count`, so neighbouring squares differ.
- **Each picture:**
  - It is an `<img>` in a box exactly `squareSize` x `squareSize`, with `margin-bottom: gap` and `object-fit: contain`, so it is not stretched and has no box around it.
  - Set the width and height explicitly: a CSS reset with `img { height: auto }` would otherwise give each square a different height and break the even rhythm.
- **A seamless loop:**
  - One loop is the smallest whole number of picture rounds at least 1600px tall: `rounds = max(1, ceil(1600 / step / count))`, `loop = rounds * count` squares. With 6 pictures and a 170px step, that is 12 squares.
  - Each column's track holds the loop **twice** and moves by exactly one loop (half the track).
  - One loop lasts `loop * secondsPerSquare` seconds (12 x 20 = 240s), set as a CSS variable on the track.

```css
@keyframes mascotUp { from { transform: translateY(0); } to { transform: translateY(-50%); } }
@keyframes mascotDown { from { transform: translateY(-50%); } to { transform: translateY(0); } }
.up { animation: mascotUp var(--loop) linear infinite; }
.down { animation: mascotDown var(--loop) linear infinite; }
@media (prefers-reduced-motion: reduce) { .up, .down { animation: none; } }
```

- **`animate: false`:** no animation class on the tracks, so the squares show but stand still.
- **Reduced motion:** the columns stand still.

## The mascot on the result

Each Design DNA profile gets a mascot in `design-dna.json`:

| Profile | `mascot.file` | `mascot.alt` |
|---|---|---|
| The Curator | `/mascots/curator-capybara.svg` | Curator Capybara |
| The Explorer | `/mascots/explorer-echidna.svg` | Explorer Echidna |
| The Nest Builder | `/mascots/nest-builder-nene.svg` | Nest-builder Nene |
| The Strategist | `/mascots/strategist-seal.svg` | Strategist Seal |
| The Visionary | `/mascots/visionary-vole.svg` | Visionary Vole |

- **The data rule:** `mascot` is optional per profile. If given, `file` starts with `/` and `alt` is plain text, not blank, with no curly quotes.
- **`pickDesignDna()`** copies `mascot` into `result.designDna` when the profile has one.
- **`ClientResultView`:**
  - If `designDna.mascot` is set, the mascot is the **first thing inside the yellow Design DNA card**, above "DESIGN DNA" and the name.
  - It is centred, in a box 144 x 144px (176 x 176px from 640px) with `object-fit: contain` and no box around it.
  - Its `alt` is the mascot's name.
  - With no mascot, the card is unchanged.
- **Where it shows:** everywhere `ClientResultView` shows a short quiz result. The team brief is unchanged.

## Steps (test first: write the failing test, then the code)

- [ ] Copy the 6 files into `public/mascots/`.
- [ ] Wording: `intro` as a string or a list with `**bold**`, the optional `button` and `logo`, the real file updated, through `config.welcome`.
  - Tests: the real file gives the heading, the two paragraphs, "Get Started" and the logo; a single string becomes one paragraph; an empty list, a blank paragraph, an unpaired `**`, a blank button, a logo path without `/` and a blank logo `alt` are each refused; the bold helper splits "It takes about **5 minutes**, and ..." into plain, bold and plain parts.
- [ ] The `welcome` settings, through `config.look.welcome`.
  - Tests: the real file gives the 6 pictures, 20 seconds, 150px, a 20px gap, `animate: true` and `opacity: 10`; left out gives `null`; `animate` defaults to true and `opacity` to 100; each bad value above is refused naming `welcome`; every listed picture exists in `public/`.
- [ ] `WelcomeCard` for the `"welcome"` screen.
  - Tests: the card shows the logo (alt "Banfield Design Co.") before the heading, the heading "Find your Design DNA", both paragraphs with "5 minutes" in `<strong>`, and a "Get Started" button; pressing it opens question 1 and starts the clock exactly as "Let's start" did; focus starts on the heading; Back from question 1 returns to the card; no footer on this screen.
- [ ] `MascotBackground` behind the card, on the welcome screen only.
  - Tests: 15 columns; the middle one is "down" and the others alternate outwards; odd-distance columns are shifted by half a step; each track holds the loop twice with a `--loop` of `loop * secondsPerSquare` seconds; with `animate: false` no column has an animation class; the layer is `aria-hidden`, not clickable, has nothing to Tab to, and every image has `alt=""`; the layer's opacity is 0.1; the card's logo is not inside the faded layer; it is gone after "Get Started".
- [ ] The mascot on the result.
  - Tests: each of the 5 profiles has the mascot in the table above, and each file exists; a profile without `mascot` loads; a bad path or blank `alt` is refused; `pickDesignDna()` includes the mascot; the result shows the mascot as the first thing in the Design DNA card, named by its `alt`; with no mascot there is no image in the card; the result still contains no client type id.
- [ ] Check the welcome screen inside the iframe: it should be exactly the `embedMinHeight` tall (650 on a phone, 850 on a computer), with the card centred.
- [ ] Lint, tests and build pass. Try it on a phone and a computer, with reduced motion, and inside the iframe.

## Decisions (from Jaida, in the sandbox)

- The welcome card matches the swatch cards (border, width, padding); the heading matches a card question and the text matches the answers.
- "Get Started" replaces "Let's start"; the button keeps the existing primary look.
- The logo sits above the heading on the card, and is also one of the pictures in the columns (1 square in 6).
- Plain pictures with no box, 150px squares with a 20px gap, faded to 10%.
- The middle column moves down and the others alternate; 20 seconds per square; still with reduced motion; an on/off switch.
- No footer on the welcome screen; the same iframe height as the other screens.
- On the result, the person's mascot sits at the top of their Design DNA card (Claude's recommendation, approved by Jaida).
