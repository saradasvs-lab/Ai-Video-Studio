'use client'

import useSWR, { mutate as mutateSWR } from 'swr'
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
        const response = await fetch(`/api/generations?id=${id}`, { method: 'DELETE' })
        if (!response.ok) throw new Error('Could not delete the saved generation.')
        return { generations: (current?.generations ?? []).filter((g) => g.id !== id) }
      },
      {
        optimisticData: (current) => ({
          generations: (current?.generations ?? []).filter((g) => g.id !== id),
        }),
        revalidate: false,
      },
    )
    await mutateSWR('/api/credits')
  }

  return { generations: data?.generations ?? [], isLoading, mutate, remove }
}
