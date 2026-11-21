'use client'

import useSWR from 'swr'
import type { Generation } from '@/lib/db'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useGenerations(kind?: 'image' | 'video') {
  const { data, mutate, isLoading } = useSWR<{ generations: Generation[] }>(
    `/api/generations${kind ? `?kind=${kind}` : ''}`,
    fetcher,
  )

  async function remove(id: number) {
    await mutate(
      async (current) => {
        await fetch(`/api/generations?id=${id}`, { method: 'DELETE' })
        return { generations: (current?.generations ?? []).filter((g) => g.id !== id) }
      },
      {
        optimisticData: (current) => ({
          generations: (current?.generations ?? []).filter((g) => g.id !== id),
        }),
        revalidate: false,
      },
    )
  }

  return { generations: data?.generations ?? [], isLoading, mutate, remove }
}
