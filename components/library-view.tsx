'use client'

import { useState } from 'react'
import { useGenerations } from '@/lib/use-generations'
import { cn } from '@/lib/utils'
import { GenerationFeed } from './studio/generation-feed'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
] as const

export function LibraryView() {
  const { generations, isLoading, remove } = useGenerations()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all')
  const visible = filter === 'all' ? generations : generations.filter((g) => g.kind === filter)

  return (
    <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-8 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground">
            Everything you&apos;ve created in this browser. Download anytime, watermark-free.
          </p>
        </div>
        <div role="tablist" aria-label="Filter" className="flex gap-1 rounded-full border border-border p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm transition-colors',
                filter === f.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <GenerationFeed
        generations={visible}
        isLoading={isLoading}
        onDelete={remove}
        emptyText="Nothing here yet. Head to the Image or Video studio to create something."
      />
    </main>
  )
}
