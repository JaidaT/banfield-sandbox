import { useId } from 'react'
import type { IntroScreenProps } from '@/components/form/IntroScreen'
import { BUTTON_MAIN } from '@/components/form/styles'
import MascotBackground from '@/components/quick-quiz/MascotBackground'
import { boldParts } from '@/lib/quick-quiz/boldText'
import { loadQuizForm } from '@/lib/quick-quiz/load'
import { loadSwatchLook } from '@/lib/quick-quiz/swatchLook'

// The welcome wording (data/quick-quiz/quiz-form.json): paragraphs with
// **bold** parts, and the start button's label.
const WELCOME = loadQuizForm().welcome
// The moving mascot columns behind the card (data/quick-quiz/swatch-cards.json;
// null: a plain background).
const BACKGROUND = loadSwatchLook().welcome

// The Quick Quiz's welcome card (docs/WELCOME_MASCOTS_PLAN.md, Jaida,
// 2026-11-23): shaped like a swatch card (white, rounded, the thin light-grey
// border, the same width), centred on the screen. The heading is the size of a
// card question, the text the size of the card answers. Behind it, the moving
// mascot columns.
export default function WelcomeScreen({ step, buttonLabel, onNext, headingRef }: IntroScreenProps) {
  const headingId = useId()
  return (
    <div className="flex flex-1 flex-col justify-center">
      {BACKGROUND ? <MascotBackground look={BACKGROUND} /> : null}
      <section
        data-testid="welcome-card"
        aria-labelledby={headingId}
        className="relative z-10 flex flex-col gap-5 rounded-2xl border-2 border-[var(--line)] bg-white p-4 sm:p-8"
      >
        <h2
          ref={headingRef}
          id={headingId}
          tabIndex={-1}
          data-screen="welcome"
          className="text-center text-lg font-bold leading-snug text-charcoal outline-none sm:text-xl"
        >
          {step.title}
        </h2>
        {WELCOME.intro.map((paragraph) => (
          <p key={paragraph} className="leading-snug">
            {boldParts(paragraph).map((part, index) => (part.bold ? <strong key={index}>{part.text}</strong> : part.text))}
          </p>
        ))}
        <button type="button" onClick={onNext} className={`${BUTTON_MAIN} mt-3 w-full`}>
          {WELCOME.button ?? buttonLabel}
        </button>
      </section>
    </div>
  )
}
