'use client'

import { useState } from 'react'

type Status = 'idle' | 'copied' | 'failed'

const LABELS: Record<Status, string> = {
  idle: 'Copy as text',
  copied: 'Copied',
  failed: 'Copy failed',
}

// Backup for when navigator.clipboard is missing or blocked, e.g. a phone
// testing the dev server over Wi-Fi (plain http). Safe to keep in production:
// on https the clipboard normally works and this never runs.
function copyWithTextarea(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  area.setSelectionRange(0, text.length)
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}

// icon: a small clipboard button (demo styling, 2026-11-17), named for screen
// readers by its status ("Copy as text", "Copied", "Copy failed").
export default function CopyBriefButton({ text, icon = false }: { text: string; icon?: boolean }) {
  const [status, setStatus] = useState<Status>('idle')

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus(copyWithTextarea(text) ? 'copied' : 'failed')
    }
  }

  if (icon) {
    return (
      <button
        type="button"
        onClick={copy}
        aria-label={LABELS[status]}
        title={LABELS[status]}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-navy transition-colors hover:bg-accent/30 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        {status === 'copied' ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="8" y="3" width="8" height="4" rx="1" />
            <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
          </svg>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-frost transition-opacity hover:opacity-90"
    >
      {LABELS[status]}
    </button>
  )
}
