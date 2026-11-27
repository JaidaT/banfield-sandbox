# Welcome Screen with Moving Mascots: Plan (2026-11-23)

**For:** Claude and Jaida. Behaviour first, so it also works in another repo; sandbox files and branches are in "In the sandbox" at the end.

**Status:** built in the sandbox on 2026-11-23 and checked in Chrome. Jaida's check on a phone and a computer is still open.

**Builds on:** `SWATCH_ROOMS_PLAN.md` (it ships with the swatch cards and the room that builds). Only the Quick Quiz's welcome screen changes; the long questionnaire's welcome screen stays as it is.

## What it looks like

From Jaida's mockup (2026-11-23):

```
 |  ^   |   v   |  ^   |   <- columns of mascot squares
 | [ ]  |  [ ]  | [ ]  |      outer columns move up,
 |   +------------------+ |   the middle one moves down
 |   | Find your Design DNA |
 |   |                      |
 |   | Discover how you ... |
 |   |                      |
 |   | It takes about       |
 |   | 5 minutes, and ...   |
 |   |                      |
 |   | [   Get Started    ] |
 |   +------------------+ |
 | [ ]  |  [ ]  | [ ]  |
```

### The card
- **Centred** over the background, across and down.
- **Shape:** the same as a swatch card: white, rounded, the same thin light-grey border, and the same width as the swatch cards on a phone and on a computer.
- **Padding:** the same as the swatch card strip (16px at the sides on a phone, 32px on a computer).
- **Heading:** "Find your Design DNA", centred. It's the same size and weight as a swatch card question (bold, 18px on a phone, 20px on a computer), in the dark text colour.
- **Text:** the same size as the swatch card answers. It's two paragraphs, with **5 minutes** in bold:
  - "Discover how you approach projects, and how Banfield Design Co. can help bring your dream home to life."
  - "It takes about **5 minutes**, and there are no wrong answers."
- **Button:** "Get Started", full width, the quiz's usual main button (yellow, with the corners as they are now).

### The background
- **Colour:** the same off-white as the rest of the quiz.
- **Squares:** columns of mascot squares, **150px** with a 12px gap (Jaida, 2026-11-27; first 112px). Every other column is shifted down by half a square, as in the mockup.
- **Movement:** the middle column moves down, and the columns on either side alternate: up, down, up and so on, outwards from the middle. Each loop is seamless. **One square takes 20 seconds to travel its own height.**
- **Speed is a setting,** so Jaida can change it without code.
- **Faded to 30%** (Jaida, 2026-11-27): `"opacity"` in the welcome settings, in percent (left out: 100). Only the columns fade; the logo on the card stays at full strength.
- **On/off switch** (Jaida, 2026-11-23): `"animate"` in the welcome settings. `true` (or left out) moves the columns; `false` keeps the squares but stops the movement.
- **Reduced motion:** with "reduce motion" turned on in the phone or computer settings, the columns stay still.
- **Filling the space:** on a phone about 3 columns show. On wider screens more columns fill the sides, so the card stays the swatch cards' width.
- **Hidden from screen readers:** the background is decoration only. Screen readers and the Tab key skip it, and it can't be clicked.
- **The pictures** (Jaida, 2026-11-27): the 5 Design DNA mascots (Curator Capybara, Explorer Echidna, Nest-builder Nene, Strategist Seal, Visionary Vole), then the Banfield logo, in turn down each column, so the logo is 1 square in 6. **Plain, no box:** each fits inside its square without stretching (the drawings are not square; the logo is wide, so it shows small). They replaced the first grey placeholders. The list of pictures is a setting, so pictures can be added or removed without code.
- **The logo on the card** (Jaida, 2026-11-27): centred above the heading, 160px wide on a phone and 192px on a computer (Claude's first size, to tune). Screen readers read it as "Banfield Design Co.". It is `"logo"` in the welcome wording; leave it out for no logo.

### The rest of the screen
- **No "Powered by Foyer." footer** on the welcome screen. Every other screen keeps it.
- **Inside the website's iframe, the same height as the other screens** (from `embedMinHeight`: 650px on a phone and 850px on a computer since Jaida lowered them on 2026-11-23; 715px and 960px when built). This replaces "the welcome screen is left out" in `SWATCH_ROOMS_PLAN.md`. On the quiz's own page, the welcome screen fills the window.

## Steps

Test first for each step (TDD); run lint, tests and build, then commit and push after each.

### Phase 1: Wording and settings
- [x] **Wording:** the welcome wording becomes the heading, the two paragraphs and the button label. In the data, `**...**` marks bold text. Tests check the wording and that the bold part shows in bold.
- [x] **Settings:** a `"welcome"` setting holds the list of pictures, the speed (20 seconds per square) and the square size. The parser rejects a missing picture or a speed or size of zero or less. Tests check the real file and each refusal.
- [x] **Placeholders:** 5 placeholder SVG files (a grey square with a cross), replaced by the real mascots and logo on 2026-11-27. A test checks that every listed file exists.

### Phase 2: The welcome screen
- [x] **Own welcome screen:** the shared form can take its own welcome screen, as it already does for step screens. If none is given, it uses the current one, so the long questionnaire is unchanged. Tests check both.
- [x] **The card:** heading, text and "Get Started". Pressing the button starts the quiz, and the timer still starts on the first press. Tests check both.
- [x] **Footer:** not shown on the welcome screen, but still shown on the cards. Tests check both.
- [x] **Iframe height:** the welcome screen is no longer left out of the iframe minimum height. Remeasure the iframe in Chrome.

### Phase 3: The moving background
- [x] **Columns:** the columns of squares, with every other column shifted by half a square. Tests check that they're hidden from screen readers and can't be clicked or reached with Tab.
- [x] **Directions:** the middle column moves down, and the others alternate outwards. Tests check each column's direction.
- [x] **Animation:** each column's loop time comes from the speed setting. With reduced motion, the columns don't move. Tests check the loop time; the reduced-motion rule is CSS.
- [x] **Filling the space:** enough columns to fill a computer screen, with the edges cut off neatly.

### Phase 4: Check
- [x] **Measure in Chrome:** check the welcome screen's height in the iframe on a phone and on a computer, at 715 and 960. Measured 2026-11-23: 715 and 960; the columns move about 6px a second (124px in 20 seconds) and stand still with reduced motion.
- [ ] **Jaida's check:** Jaida tries it on a phone and a computer, then tunes the square size and speed if needed.

## In the sandbox
- **Branch:** `foyer-v1-swatch-rooms`.
- **Wording:** `data/quick-quiz/quiz-form.json` (`welcome`).
- **Settings:** `data/quick-quiz/swatch-cards.json` (`welcome`), parsed in `lib/quick-quiz/swatchLook.ts`.
- **Pictures:** `public/mascots/`: `curator-capybara.svg`, `explorer-echidna.svg`, `nest-builder-nene.svg`, `strategist-seal.svg`, `visionary-vole.svg`, `banfield-logo.svg` (Jaida's files). Listed in `"welcome"` > `"pictures"` in `data/quick-quiz/swatch-cards.json`; the card logo is `"welcome"` > `"logo"` in `data/quick-quiz/quiz-form.json`.
- **Welcome screen extension point:** new `introScreen` and `hideFooterOnWelcome` props on `components/form/QuestionnaireForm.tsx`. The new screen is `components/quick-quiz/WelcomeScreen.tsx`; the columns are `components/quick-quiz/MascotBackground.tsx`, with their rules in `lib/quick-quiz/mascotColumns.ts` (15 columns, enough for a wide screen) and the animation at the end of `app/globals.css`.
- **Bold text:** `lib/quick-quiz/boldText.ts`.
- **Tests:** `__tests__/quick-quiz/welcomeSettings.test.ts`, `welcomeScreen.test.tsx`, `mascotBackground.test.tsx`, and the `introScreen` tests in `__tests__/form/questionnaireForm.test.tsx`.
- **The iframe rule:** in `app/globals.css`, the iframe minimum height rule drops its `:not(:has([data-screen="welcome"]))` part.
