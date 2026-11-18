'use client'

import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

export interface BriefTab {
  label: string
  content: ReactNode
}

// The brief's Analysis and Documentation tabs (demo styling, 2026-11-17).
// The first tab shows first. Only the chosen tab's content is on the page.
// Keyboard: Left and Right arrows (and Home, End) move between the tabs.
export default function BriefTabs({ tabs }: { tabs: BriefTab[] }) {
  const [current, setCurrent] = useState(0)
  const baseId = useId()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  function choose(index: number) {
    const next = (index + tabs.length) % tabs.length
    setCurrent(next)
    buttons.current[next]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const moves: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }
    if (event.key in moves) {
      event.preventDefault()
      choose(moves[event.key])
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Brief" className="flex self-center rounded-full border-2 border-accent bg-white p-1">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            ref={(el) => {
              buttons.current[index] = el
            }}
            id={`${baseId}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={index === current}
            aria-controls={`${baseId}-panel`}
            tabIndex={index === current ? 0 : -1}
            onClick={() => setCurrent(index)}
            onKeyDown={onKeyDown}
            className="rounded-full px-5 py-1.5 text-sm font-semibold text-charcoal transition-colors hover:bg-accent/30 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-navy aria-selected:bg-accent"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${current}`} className="flex flex-col gap-8">
        {tabs[current].content}
      </div>
    </div>
  )
}
