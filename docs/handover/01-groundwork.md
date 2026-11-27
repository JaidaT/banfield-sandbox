# Handover 1 of 4: Groundwork (settings, iframe, footer)

**For:** the production team and its Claude agent (`foyer_prod`).
**From:** the Banfield sandbox, branch `foyer-v1-swatch-rooms`, where all four handovers were built and tried (2026-11-20 to 2026-11-27).
**Build order:** 1 (this file), then 2 (swatch cards), 3 (the room that builds), 4 (welcome screen and mascots). Each file starts by listing what it expects to already exist.

Nothing here is copied as code: the sandbox is TypeScript and Tailwind, production is JavaScript and CSS Modules. Values are given as plain CSS (pixels, colours, timings). Where CSS is shown, it is plain CSS that can go into a `.module.css` file as it is.

## Expects (check before starting; if any is different, stop and flag it)

- JavaScript, Next.js 16 (App Router), React 19, CSS Modules only, design tokens as CSS variables in `app/globals.css`.
- `ShortQuestionnaire` takes one prop, `config`, built on the server by `shortQuestionnaireScreenConfig()` in `lib/short-questionnaire/clientForm.js`.
- Only the server-only `lib/short-questionnaire/data.js` reads `data/short-questionnaire/`, and `parse.js` validates every file there (including rejecting curly quotes).
- `ShortQuestionnaire` keeps one state value, `screen`: `"welcome"`, then a question index `0..n-1`, then `"contact"`, then `"result"`.
- Each screen change calls `window.scrollTo(0, 0)`.
- No iframe code exists, except `target="_top"` on the booking button in `ClientResultView`.
- `client-result.json` has `thanks: { title, text }`, with `text` required.
- `Button`, `Card` and `ProgressBar` (in `components/ui/`) have fixed props, because students are rebuilding them. **None of the four handovers changes them.** Everything new is a new component.

## 1. A settings file for the quiz's look

A new file, `data/short-questionnaire/swatch-cards.json`, holds the look settings from all four handovers, so the team can tune them without code changes. Like every file in that folder, it is read by `data.js`, checked by `parse.js`, and reaches the browser only through `config`.

**Contract:** `shortQuestionnaireScreenConfig()` adds one field, `config.look`, holding the checked settings. Nothing else in `config` changes in this file. Handovers 2 to 4 each add their own fields to `look`.

This file adds one setting:

| Field | Type | Now | Left out | Refused |
|---|---|---|---|---|
| `embedMinHeight` | `null` or `{ phone: number, computer: number }` (pixels) | `{ "phone": 650, "computer": 850 }` | `null` | anything but `null` or two numbers above 0 |

Like the other data files, it has a `_meta` block of notes, and no curly quotes.

## 2. The quiz inside the website's iframe

The quiz will sit in an iframe on `https://www.banfielddesign.co/` (Squarespace). Nothing for this exists yet. In the sandbox the quiz and the website talk with two small messages, and a short script on the website page acts on them.

### 2a. Allow Banfield's website to frame the quiz

In `next.config.mjs`, send this header on the short quiz's page only:

```
Content-Security-Policy: frame-ancestors 'self' https://www.banfielddesign.co
```

`'self'` keeps a test page on the quiz's own site working. Flag to Jaida: whether `https://banfielddesign.co` (without `www`) and Squarespace's editor preview also need adding. She only knows the `www` address.

### 2b. What the quiz does when it is in an iframe

"In an iframe" means `window.parent !== window`. On its own page, none of this happens.

1. **Marks the page as embedded:** sets a `data-embedded` attribute on `<html>`, and removes it when the quiz unmounts. Later handovers use it in CSS.
2. **Sends its height** whenever the content height changes, with a `ResizeObserver` on the quiz's main content box. Measure the bottom of that content box plus `window.scrollY`, not the page itself: the page stretches to fill the window, so measuring it would let the iframe grow but never shrink. Send only when the rounded height changes.
3. **Sends "new screen"** after each move to a new screen (Next, Back, "See my results", the result appearing).

Both messages are plain objects sent with `window.parent.postMessage(message, '*')`:

```js
{ source: 'banfield-quick-quiz', type: 'height', height: 812 } // a whole number of pixels
{ source: 'banfield-quick-quiz', type: 'new-screen' }
```

The target `'*'` is a deliberate choice: the messages never hold answers or contact details, only a height or "new screen", and 2a already limits which websites can frame the quiz.

### 2c. The quiz's height inside the iframe

The content box is only as tall as its content inside the iframe (no stretching to fill the window), **but at least `embedMinHeight`**, so the iframe does not grow and shrink on every card. Shorter screens leave space above the buttons, which stay at the bottom. A card taller than the minimum makes the iframe grow, and it shrinks back afterwards.

- Below 640px wide: at least `embedMinHeight.phone` (650px). From 640px wide: at least `embedMinHeight.computer` (850px).
- Every screen, including the welcome screen.
- With `embedMinHeight: null`: no minimum, so the iframe fits each screen.
- Only when `data-embedded` is set. The quiz on its own page is unchanged.

Measured in Chrome with all four handovers: the tallest card needs about 703px on a 375px-wide phone and 947px on a computer, so with 650/850 the iframe grows on the tallest cards. Jaida chose that trade-off: less empty space on short cards. Re-measure after any layout change.

### 2d. The script on the website page

Banfield pastes this into Squarespace code injection, once, on the page with the quiz. It is plain JavaScript with no build step. It is the script tried in the sandbox, unchanged; serve it from `public/quick-quiz-embed.js`.

- **Height message:** sets the iframe to that height, so there is no scroll box inside the page.
- **New-screen message:** scrolls the page so the top of the quiz sits just below any sticky header, **only if the top is out of view, and only on touch screens**. With a mouse or trackpad (`(hover: hover) and (pointer: fine)`) the page stays put. With reduced motion it jumps instead of scrolling smoothly.
- **It only accepts messages** from an iframe marked `data-quick-quiz`, coming from that iframe's own web address.

The iframe tag on the Squarespace page:

```html
<iframe src="https://<the quiz's address>/<the short quiz's path>" data-quick-quiz title="Quick Quiz" style="width:100%;border:0"></iframe>
```

A sticky header's height is taken from `data-header-offset="80"` on the iframe (pixels), or else from an element marked `data-sticky-header`, or else 0.

The full script is in the appendix at the end of this file.

### 2e. Scrolling inside the quiz (replaces `window.scrollTo(0, 0)`)

Production scrolls to the top on every screen change. Replace that with the sandbox's behaviour:

- **Focus:** after each move, focus moves to the new screen's main heading with `focus({ preventScroll: true })`, so the browser does not scroll on its own.
- **On the quiz's own page, touch screens only:** if the top of the quiz is above the visible screen, scroll it into view (smoothly, or instantly with reduced motion). If it is already in view, or the device uses a mouse or trackpad, do nothing.
- **Inside the iframe:** the quiz does not scroll at all. It sends "new screen" (2b), and the website's script decides.

Why: on a phone, the browser's own scroll to the focused heading left the progress area out of view above the new card. On a computer, jumping on every click felt wrong.

## 3. "Powered by Foyer." footer

- **Wording:** "Powered by **Foyer.**", with "Foyer." in bold.
- **Look:** 12px, centred, the charcoal text colour at 60% opacity, 8px of space above it.
- **Where:** the last thing inside the quiz's main content box, so the iframe's height includes it. It sits at the bottom edge on short screens.
- **Which screens:** every screen (cards, "Calculating", the result), **except the welcome screen** (handover 4).
- New component, for example `PoweredBy`, with no props.

## 4. No line under "Thank you!"

The result ends with the "Thank you!" heading and then the footer.

- Make `thanks.text` optional in `client-result.json` and in `parse.js`. If it is given, it must not be blank.
- Remove it from the real file.
- `ClientResultView` shows the line only when `thanks.text` is present.
- `thanks.title` stays required.

## Steps

Production has no test runner. Each step ends with a **check by hand**: short steps to click through in `npm run dev` (or with the browser's developer tools where noted). The data checks in `parse.js` act as the automatic safety net: a bad settings or data file stops the app with a message naming the problem.

- [ ] The settings file, with its check in `parse.js` and `config.look.embedMinHeight`.
  - Check by hand: the app starts with the real file. Temporarily set `"phone": 0`: the app refuses to start with a message naming `embedMinHeight`. Set it back.
- [ ] The frame-ancestors header on the short quiz's page.
  - Check by hand: in the browser's developer tools (Network tab), the short quiz page's response has `Content-Security-Policy: frame-ancestors 'self' https://www.banfielddesign.co`. Other pages do not have it.
- [ ] The iframe connection: `data-embedded`, the height message and the new-screen message, only inside an iframe.
  - Check by hand: on the quiz's own page, `<html>` has no `data-embedded` (Elements tab). On the stand-in page (last step), `<html>` inside the iframe has `data-embedded`, and the iframe changes height when the screen changes.
- [ ] The minimum height inside the iframe, on every screen.
  - Check by hand: on the stand-in page, the iframe is 650px tall on a phone-width window and 850px on a computer-width window, on the welcome screen and on a short card.
- [ ] Focus without the browser scroll, and the touch-only scroll into view (replacing `scrollTo(0, 0)`).
  - Check by hand: on a computer, scroll down a little and press Next: the page does not jump, and Tab starts from the new question. On a phone (or the developer tools' phone mode with touch), scroll so the top of the quiz is off screen and press Next: the quiz's top scrolls into view.
- [ ] The website script in `public/quick-quiz-embed.js`.
  - Check by hand: on the stand-in page, there is no scroll box inside the iframe on any screen; on a phone, Next scrolls the page to the top of the quiz when it is out of view, and not when it is in view; on a computer, the page never scrolls by itself.
- [ ] The footer on every screen except the welcome screen.
  - Check by hand: "Powered by **Foyer.**" is the last thing on a question, the contact screen, "Calculating" and the result; it is not on the welcome screen.
- [ ] `thanks.text` optional, and removed from the real file.
  - Check by hand: the result ends with "Thank you!" and then the footer, with no line between. Temporarily set `"text": ""`: the app refuses to start. Remove the line again.
- [ ] A stand-in website page that shows the quiz in an iframe with the script, for trying it on a phone (a plain page with some text above and below the iframe is enough).
- [ ] Lint and build pass. Try the quiz inside the stand-in page on a phone and a computer.

## Appendix: the website script (`public/quick-quiz-embed.js`)

```js
/*
 * Quick Quiz embed script. Goes on the website page that shows the Quick Quiz
 * in an iframe (Squarespace code injection). Plain JavaScript, no build step.
 *
 * The quiz sends two kinds of messages:
 *   - its height: this script sets the iframe to that height (no scroll box);
 *   - "new screen": this script scrolls the page so the top of the quiz sits
 *     just below the sticky header, only if the top is out of view, and only
 *     on touch screens (with a mouse or trackpad the page stays put).
 *
 * The iframe needs a data-quick-quiz attribute. The gap left for a sticky
 * header is: data-header-offset="80" on the iframe, or the height of an
 * element marked data-sticky-header, or nothing.
 *
 * Messages are only accepted from the quiz's own iframe and web address.
 */
(function () {
  if (window.__quickQuizEmbed) return; // already running (pasted twice)
  window.__quickQuizEmbed = true;

  var SOURCE = 'banfield-quick-quiz';

  // The quiz iframe this message came from, or null.
  function quizFrameFor(event) {
    var frames = document.querySelectorAll('iframe[data-quick-quiz]');
    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      if (event.source !== frame.contentWindow) continue;
      var origin;
      try {
        origin = new URL(frame.src, window.location.href).origin;
      } catch {
        return null; // an iframe address the browser cannot read
      }
      return event.origin === origin ? frame : null;
    }
    return null;
  }

  function headerGap(frame) {
    var set = Number(frame.getAttribute('data-header-offset'));
    if (frame.hasAttribute('data-header-offset') && isFinite(set) && set >= 0) return set;
    var header = document.querySelector('[data-sticky-header]');
    return header ? header.getBoundingClientRect().height : 0;
  }

  // True when the device is used with a mouse or trackpad, not a finger.
  function usesMouse() {
    return !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }

  function scrollToQuiz(frame) {
    if (usesMouse()) return;
    var gap = headerGap(frame);
    var top = frame.getBoundingClientRect().top;
    // Already in view, below the header: leave the page where it is.
    if (top >= gap && top < window.innerHeight) return;
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: window.scrollY + top - gap, behavior: calm ? 'auto' : 'smooth' });
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object' || data.source !== SOURCE) return;
    var frame = quizFrameFor(event);
    if (!frame) return;

    if (data.type === 'height') {
      var h = data.height;
      if (typeof h !== 'number' || !isFinite(h) || h < 0) return;
      frame.setAttribute('scrolling', 'no');
      frame.style.overflow = 'hidden';
      frame.style.height = Math.round(h) + 'px';
    } else if (data.type === 'new-screen') {
      scrollToQuiz(frame);
    }
  });
})();
```
