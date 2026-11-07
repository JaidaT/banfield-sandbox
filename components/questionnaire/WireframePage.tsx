import type { ReactNode } from 'react'

// The plain white page every questionnaire screen sits on, with a dashed
// banner at the top so nobody mistakes it for the final design.
export default function WireframePage({ banner, children }: { banner: string; children: ReactNode }) {
  return (
    <div className="flex-1 bg-white font-[system-ui] text-neutral-900">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
        <p className="rounded border border-dashed border-neutral-500 bg-neutral-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-widest text-neutral-600">
          {banner}
        </p>
        {children}
      </main>
    </div>
  )
}
