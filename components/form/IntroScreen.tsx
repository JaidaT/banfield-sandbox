import type { Ref } from 'react'
import { BUTTON_MAIN, BUTTON_ROW, HEADING } from './styles'
import type { Step } from '@/lib/form/types'

interface Props {
  step: Step
  buttonLabel: string
  onNext: () => void
  headingRef: Ref<HTMLHeadingElement>
}

// A step with no questions, such as the welcome: a title, some text and a button.
// data-screen="welcome" lets page styles treat it differently (the Quick
// Quiz's iframe minimum height skips it, 2026-11-22).
export default function IntroScreen({ step, buttonLabel, onNext, headingRef }: Props) {
  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} data-screen="welcome" className={HEADING}>
        {step.title}
      </h2>
      {step.intro ? <p className="leading-7">{step.intro}</p> : null}
      <div className={BUTTON_ROW}>
        <button type="button" onClick={onNext} className={BUTTON_MAIN}>
          {buttonLabel}
        </button>
      </div>
    </>
  )
}
