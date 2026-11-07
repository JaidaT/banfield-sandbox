import type { Ref } from 'react'
import { BUTTON_MAIN, HEADING } from './styles'
import type { Step } from '@/lib/questionnaire/types'

interface Props {
  step: Step
  buttonLabel: string
  onNext: () => void
  headingRef: Ref<HTMLHeadingElement>
}

// A step with no questions, such as the welcome: a title, some text and a button.
export default function IntroScreen({ step, buttonLabel, onNext, headingRef }: Props) {
  return (
    <>
      <h2 ref={headingRef} tabIndex={-1} className={HEADING}>
        {step.title}
      </h2>
      {step.intro ? <p className="leading-7">{step.intro}</p> : null}
      <div>
        <button type="button" onClick={onNext} className={BUTTON_MAIN}>
          {buttonLabel}
        </button>
      </div>
    </>
  )
}
