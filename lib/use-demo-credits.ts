'use client'

import useSWR from 'swr'
import { getCredits, spendCredit, CREDITS_KEY } from '@/lib/credits'

function fetchCredits() {
  return getCredits()
}

export function useDemoCredits() {
  const { data, mutate } = useSWR(CREDITS_KEY, fetchCredits, {
    refreshInterval: 2000,
    fallbackData: getCredits(),
  })

  function spend(): boolean {
    const ok = spendCredit()
    mutate()
    return ok
  }

  return {
    credits: data ?? 0,
    mutate,
    spend,
  }
}
