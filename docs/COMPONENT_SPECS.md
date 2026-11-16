# Component specs (hand-built components)

Each team member builds one of these by hand, with hand-written CSS. You can
build it in your own repo, then copy it into this one. If it follows its spec
below, it should drop straight in.

These specs say what each component must **accept** and **do**. How it looks
is up to you.

## Rules for every component

1. **React + TypeScript.** One `.tsx` file and one `.module.css` file, side by
   side, e.g. `ProgressBar.tsx` and `ProgressBar.module.css`. They will live in
   `components/form/`.
2. **Hand-written CSS only** in your component. No Tailwind classes, no UI
   libraries, no extra packages.
3. **Brand colours** are ready to use in your CSS:
   `var(--navy)`, `var(--charcoal)`, `var(--frost)`, `var(--accent)`.
4. **Style everything you want to see.** This project loads a reset that removes
   the browser's default look (button borders, heading sizes, margins). Set
   borders, padding, font size and colour yourself.
5. **Add `'use client'`** as the first line if your component handles clicks
   or typing.
6. **The parent owns the data.** Your component shows the `value` it is given
   and calls `onChange` when the person changes it. Do not keep your own copy
   of the answer in `useState`.
7. **Mobile first.** Check it at phone width (about 375px wide). Tap targets
   should be at least 44px tall.
8. **Show a visible focus outline** (`:focus-visible`) so keyboard users can
   see where they are.
9. **Use the exact prop names below.** Renaming them means rewriting the code
   that uses your component.

---

## 1. Button

A clickable button. Used for Next, Back, Submit, Edit, Add another, Remove and
"Let's start". About 13 places.

```ts
interface ButtonProps {
  children: React.ReactNode              // the words on the button
  onClick: () => void
  variant?: 'main' | 'plain' | 'small'   // default 'plain'
  disabled?: boolean
  ariaLabel?: string                     // only when the words alone are unclear
}
```

**Must:**
- Render a real `<button type="button">`, never a clickable `<div>`.
- Pass `ariaLabel` through as `aria-label`. Example: each "Remove" button is
  labelled "Remove card 2" so screen readers know which card.
- Look clearly greyed out when `disabled`.

**Variants:**
- `main`: the one important action on a screen (Next, Submit, See my results).
- `plain`: other actions (Back, Back to review).
- `small`: buttons inside a question (Add another, Remove, Edit).

**Style these states:** normal, hover, focus, disabled.

**Not included:** the links on the home page ("Try the Quick Quiz") look like
buttons but go to another page, so they stay as links.

**Replaces:** `BUTTON_MAIN`, `BUTTON` and `BUTTON_SMALL` in
`components/form/styles.ts`, used in StepScreen, IntroScreen, ReviewScreen,
Repeater, RangeField and others.

---

## 2. Card

A box that groups related content.

```ts
interface CardProps {
  children: React.ReactNode   // whatever goes inside the box
}
```

**Must:**
- Render a plain `<div>` around `children`.
- Nothing else. The code that uses it keeps its own meaningful tag around or
  inside the card (`<section>`, `<li>`, `<fieldset>`), so screen readers still
  understand the page.

**Where it will be used:**
- The two boxes on the home page (`app/page.tsx`)
- The "Add another" cards for people, kids and pets (`components/form/Repeater.tsx`)
- The groups on the "Check your answers" screen (`components/form/AnswersSummary.tsx`)
- The sample lists on the team pages (`app/team/...`)

Check it with short and long content, and at phone width.

---

## 3. Text input

One question with a typing box: its label, an optional help line, the box,
and an optional problem message.

```ts
interface TextInputProps {
  id: string                   // unique on the page, e.g. "q-email"
  label: string                // the question, e.g. "Your name"
  value: string                // what is typed so far ('' when empty)
  onChange: (value: string) => void
  help?: string                // grey hint under the label
  error?: string               // red problem message, e.g. 'Please answer "Email"'
  kind?: 'text' | 'number' | 'long'   // default 'text'; 'long' = several lines
}
```

**Must:**
- Use a `<label htmlFor={id}>` connected to the box (`id={id}` on the box).
- `kind`:
  - `'text'`: `<input type="text">`
  - `'number'`: `<input type="number" inputMode="numeric">` (number keypad on phones)
  - `'long'`: `<textarea rows={3}>`
- When `help` is given, show it in a `<p id={id + '-help'}>`.
- When `error` is given, show it in a `<p id={id + '-error'} role="alert">`.
- On the box, set `aria-describedby` to the ids of the help and/or error
  paragraphs that are showing, separated by a space (leave it off if neither shows).
- When `error` is given, set `aria-invalid="true"` on the box. **Important:** the
  form looks for `aria-invalid="true"` to move the cursor to the first problem.
- Call `onChange` with the text on every keystroke.

**Style these states:** empty, typed in, focus, has an error.

**Replaces:** the text, number and long-text boxes in
`components/form/QuestionField.tsx` (the `INPUT` style).

---

## 4. Progress bar

The bar at the top of each question screen, with its text above it.

```ts
interface ProgressBarProps {
  percent: number   // 0 to 100: how full the bar is
  label: string     // the text to show, e.g. "Step 4 of 11" or "31%"
}
```

**Must:**
- Show `label` as visible text.
- Draw the bar yourself with two `<div>`s: a track (the empty bar) and a fill
  whose width is `percent`%. Set the width with
  `style={{ width: \`${percent}%\` }}`; that one inline style is allowed
  because it changes with the number.
- Put `aria-hidden="true"` on the bar. Screen readers already read the label,
  so the bar would only repeat it.
- Look right at 0% (empty) and 100% (full).

**Note:** the code that uses it works out the numbers. The Quick Quiz passes
something like `percent={31} label="31%"`; the long questionnaire passes
something like `percent={36} label="Step 4 of 11"`.

**Replaces:** the `<progress>` elements in `components/form/StepScreen.tsx`.

---

## 5. Checkbox input

One choice in a list: a tick box (pick several) or a round radio button (pick
one), with its words. The code that uses it shows one per option and keeps the
question title around them.

```ts
interface CheckboxInputProps {
  type: 'checkbox' | 'radio'   // checkbox = pick several, radio = pick one
  name: string                 // the same for every option in one question
  value: string                // this option's id, e.g. "renovation"
  label: string                // this option's words, e.g. "A renovation"
  checked: boolean
  onChange: () => void         // called when it is clicked or tapped
  disabled?: boolean           // for "pick up to two" once two are ticked
  image?: string               // optional picture path, shown beside the words
}
```

**Must:**
- Use a real `<input type={type}>`, so the keyboard (Tab, Space, arrow keys)
  works on its own.
- Wrap the input and its words in one `<label>`, so tapping anywhere on the row
  ticks it. The whole row should be easy to tap on a phone.
- When `image` is given, show it with `alt=""` (the label already says what it is).
- Make ticked, unticked and disabled clearly different.

**Style these states:** unticked, ticked, hover, focus, disabled. Check both the
`checkbox` and `radio` types.

**Replaces:** the option rows in `components/form/QuestionField.tsx`.

---

## Before you hand it over

- [ ] The prop names match this page exactly.
- [ ] No Tailwind classes; all styling is in the `.module.css` file.
- [ ] Works with the keyboard alone (Tab to it, Space or Enter to use it).
- [ ] Focus outline is visible.
- [ ] Looks right at phone width.
- [ ] Every state listed for your component has a style.

Swap it into one place first, check it works, then swap in the rest.
