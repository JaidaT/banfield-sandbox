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

export default function CopyBriefButton({ text }: { text: string }) {
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
