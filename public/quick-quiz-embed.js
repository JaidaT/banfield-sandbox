/*
 * Quick Quiz embed script (DECISIONS.md 2026-11-15).
 *
 * Goes on the website page that shows the Quick Quiz in an iframe (for
 * Banfield: Squarespace code injection). Plain JavaScript, no build step.
 *
 * The quiz sends this page two kinds of messages:
 *   - its height: this script sets the iframe to that height, so there is no
 *     scroll box inside the page;
 *   - "new screen": this script scrolls the page so the top of the quiz sits
 *     just below the sticky header, but only if the top is out of view, and
 *     only on touch screens: with a mouse or trackpad the page stays put
 *     (Jaida, 2026-11-22).
 *
 * The iframe needs a data-quick-quiz attribute:
 *   <iframe src="https://<quiz address>/quiz" data-quick-quiz title="Quick Quiz"></iframe>
 * The gap left for a sticky header is, in order:
 *   1. data-header-offset="80" on the iframe (pixels), or
 *   2. the height of an element marked data-sticky-header, or
 *   3. nothing.
 *
 * Messages are only accepted from the quiz's own iframe and web address.
 * They hold only a height or "new screen", never answers.
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

  // True when the device is used with a mouse or trackpad (a precise pointer
  // that can hover), not a finger.
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
