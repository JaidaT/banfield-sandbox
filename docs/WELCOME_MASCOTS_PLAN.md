# Welcome Screen with Moving Mascots: Plan (2026-11-23)

**For:** Claude and Jaida. Behaviour first, so it also works in another repo; sandbox files and branches are in "In the sandbox" at the end.

**Status:** planned, not built.

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
- **Squares:** columns of mascot squares, about 112px with a 12px gap (an estimate, to tune by eye). Every other column is shifted down by half a square, as in the mockup.
- **Movement:** the middle column moves down, and the columns on either side alternate: up, down, up and so on, outwards from the middle. Each loop is seamless. **One square takes 20 seconds to travel its own height.**
- **Speed is a setting,** so Jaida can change it without code.
- **Reduced motion:** with "reduce motion" turned on in the phone or computer settings, the columns stay still.
- **Filling the space:** on a phone about 3 columns show. On wider screens more columns fill the sides, so the card stays the swatch cards' width.
- **Hidden from screen readers:** the background is decoration only. Screen readers and the Tab key skip it, and it can't be clicked.
- **Placeholders for now:** 5 grey placeholder squares with a cross, like the mockup, one per mascot. The real mascots (5 Design DNA types), and possibly Banfield portfolio photos or the logo, will replace these files later. The list of pictures is a setting, so pictures can be added or removed without code.

### The rest of the screen
- **No "Powered by Foyer." footer** on the welcome screen. Every other screen keeps it.
- **Inside the website's iframe, the same height as the other screens** (715px on a phone, 960px on a computer, from `embedMinHeight`). This replaces "the welcome screen is left out" in `SWATCH_ROOMS_PLAN.md`. On the quiz's own page, the welcome screen fills the window.

## Steps

Test first for each step (TDD); run lint, tests and build, then commit and push after each.

### Phase 1: Wording and settings
- [ ] **Wording:** the welcome wording becomes the heading, the two paragraphs and the button label. In the data, `**...**` marks bold text. Tests check the wording and that the bold part shows in bold.
- [ ] **Settings:** a `"welcome"` setting holds the list of pictures, the speed (20 seconds per square) and the square size. The parser rejects a missing picture or a speed or size of zero or less. Tests check the real file and each refusal.
- [ ] **Placeholders:** 5 placeholder SVG files (a grey square with a cross). A test checks that every listed file exists.

### Phase 2: The welcome screen
- [ ] **Own welcome screen:** the shared form can take its own welcome screen, as it already does for step screens. If none is given, it uses the current one, so the long questionnaire is unchanged. Tests check both.
- [ ] **The card:** heading, text and "Get Started". Pressing the button starts the quiz, and the timer still starts on the first press. Tests check both.
- [ ] **Footer:** not shown on the welcome screen, but still shown on the cards. Tests check both.
- [ ] **Iframe height:** the welcome screen is no longer left out of the iframe minimum height. Remeasure the iframe in Chrome.

### Phase 3: The moving background
- [ ] **Columns:** the columns of squares, with every other column shifted by half a square. Tests check that they're hidden from screen readers and can't be clicked or reached with Tab.
- [ ] **Directions:** the middle column moves down, and the others alternate outwards. Tests check each column's direction.
- [ ] **Animation:** each column's loop time comes from the speed setting. With reduced motion, the columns don't move. Tests check the loop time; the reduced-motion rule is CSS.
- [ ] **Filling the space:** enough columns to fill a computer screen, with the edges cut off neatly.

### Phase 4: Check
- [ ] **Measure in Chrome:** check the welcome screen's height in the iframe on a phone and on a computer, at 715 and 960.
- [ ] **Jaida's check:** Jaida tries it on a phone and a computer, then tunes the square size and speed if needed.

## In the sandbox
- **Branch:** `foyer-v1-swatch-rooms`.
- **Wording:** `data/quick-quiz/quiz-form.json` (`welcome`).
- **Settings:** `data/quick-quiz/swatch-cards.json` (`welcome`), parsed in `lib/quick-quiz/swatchLook.ts`.
- **Placeholders:** `public/welcome-mascots/`.
- **Welcome screen extension point:** a new `introScreen` prop on `components/form/QuestionnaireForm.tsx`. The new screen is `components/quick-quiz/WelcomeScreen.tsx`.
- **The iframe rule:** in `app/globals.css`, the iframe minimum height rule drops its `:not(:has([data-screen="welcome"]))` part.
