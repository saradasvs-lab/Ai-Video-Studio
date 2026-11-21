'use client'

import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { getCredits, formatCredits, CREDITS_KEY } from '@/lib/credits'

export function CreditsBadge() {
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    setCredits(getCredits())

    // Listen for storage changes (e.g. after a generation)
    function onStorage(e: StorageEvent) {
      if (e.key === CREDITS_KEY) {
        setCredits(getCredits())
      }
    }
    window.addEventListener('storage', onStorage)

    // Also poll every second so same-tab updates show immediately
    const interval = setInterval(() => setCredits(getCredits()), 1000)

    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(interval)
    }
  }, [])

  if (credits === null) return null

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-xs text-muted-foreground">
      <Zap className="size-3 text-yellow-400" aria-hidden="true" />
      <span>{formatCredits(credits)}</span>
      <span className="hidden sm:inline text-muted-foreground/60">credits</span>
    </span>
  )
}
