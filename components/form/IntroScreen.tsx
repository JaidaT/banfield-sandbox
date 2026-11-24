import type { Ref } from 'react'
import { BUTTON_MAIN, BUTTON_ROW, HEADING } from './styles'
import type { Step } from '@/lib/form/types'

export interface IntroScreenProps {
  step: Step
  buttonLabel: string
  onNext: () => void
  headingRef: Ref<HTMLHeadingElement>
}

// A step with no questions, such as the welcome: a title, some text and a button.
// data-screen="welcome" marks it for page styles.
export default function IntroScreen({ step, buttonLabel, onNext, headingRef }: IntroScreenProps) {
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
