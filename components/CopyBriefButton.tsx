'use client'

import { useState } from 'react'

type Status = 'idle' | 'copied' | 'failed'

const LABELS: Record<Status, string> = {
  idle: 'Copy as text',
  copied: 'Copied',
  failed: 'Copy failed',
}

export default function CopyBriefButton({ text }: { text: string }) {
  const [status, setStatus] = useState<Status>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('failed')
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
