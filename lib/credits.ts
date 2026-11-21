/**
 * Credits system — 1,000,000,000 credits per visitor.
 * Stored in localStorage so it resets when browser data is cleared.
 * Each generation (image or video) costs 1 credit.
 *
 * Key: "aetherfield_credits"
 * Value: number (remaining credits)
 */

export const CREDITS_KEY = 'aetherfield_credits'
export const INITIAL_CREDITS = 1_000_000_000

export function getCredits(): number {
  if (typeof window === 'undefined') return INITIAL_CREDITS
  try {
    const stored = localStorage.getItem(CREDITS_KEY)
    if (stored === null) return INITIAL_CREDITS
    const val = parseInt(stored, 10)
    return isNaN(val) ? INITIAL_CREDITS : Math.max(0, val)
  } catch {
    return INITIAL_CREDITS
  }
}

export function setCredits(credits: number): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CREDITS_KEY, String(Math.max(0, credits)))
  } catch {
    // ignore
  }
}

export function spendCredit(): boolean {
  const current = getCredits()
  if (current <= 0) return false
  setCredits(current - 1)
  return true
}

export function formatCredits(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
