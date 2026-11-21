'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Generation } from '@/lib/db'
import { GenerationCard } from './generation-card'
import { SequenceCard } from './sequence-card'

export type PendingJob = {
  id: string
  label: string
  aspectRatio: string
  slots: number
  startedAt: number
  progress?: string
}

type FeedItem =
  | { type: 'single'; key: string; generation: Generation }
  | { type: 'sequence'; key: string; clips: Generation[] }

function groupGenerations(generations: Generation[]): FeedItem[] {
  const items: FeedItem[] = []
  const sequences = new Map<string, Generation[]>()
  for (const generation of generations) {
    if (!generation.sequence_id) {
      items.push({ type: 'single', key: `g-${generation.id}`, generation })
      continue
    }
    const existing = sequences.get(generation.sequence_id)
    if (existing) {
      existing.push(generation)
    } else {
      const clips = [generation]
      sequences.set(generation.sequence_id, clips)
      items.push({ type: 'sequence', key: `s-${generation.sequence_id}`, clips })
    }
  }
  for (const clips of sequences.values()) clips.sort((a, b) => a.id - b.id)
  return items
}

export function GenerationFeed({
  generations,
  pending = [],
  isLoading,
  onDelete,
  onReuse,
  emptyText,
}: {
  generations: Generation[]
  pending?: PendingJob[]
  isLoading?: boolean
  onDelete: (id: number) => void
  onReuse?: (prompt: string) => void
  emptyText: string
}) {
  const items = groupGenerations(generations)
  const isEmpty = !isLoading && items.length === 0 && pending.length === 0

  return (
    <div className="flex flex-col gap-5" aria-busy={pending.length > 0 || isLoading}>
      <header className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
            Workspace / History
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">My generations</h2>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {`${generations.length} saved`}
        </p>
      </header>
      {isEmpty ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center">
          <Sparkles className="size-6 text-primary" aria-hidden="true" />
          <p className="max-w-sm text-sm text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <div className="columns-1 gap-3 sm:columns-2 2xl:columns-3">
          {pending.flatMap((job) =>
            Array.from({ length: job.slots }, (_, i) => <PendingCard key={`${job.id}-${i}`} job={job} />),
          )}
          {items.map((item) =>
            item.type === 'single' ? (
              <GenerationCard
                key={item.key}
                generation={item.generation}
                onDelete={onDelete}
                onReuse={onReuse}
              />
            ) : (
              <SequenceCard key={item.key} clips={item.clips} onDelete={onDelete} onReuse={onReuse} />
            ),
          )}
        </div>
      )}
    </div>
  )
}

function PendingCard({ job }: { job: PendingJob }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const elapsed = Math.max(0, Math.floor((now - job.startedAt) / 1000))

  return (
    <div className="mb-3 flex break-inside-avoid flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="shimmer w-full" style={{ aspectRatio: job.aspectRatio.replace(':', '/') }} />
      <div className="flex items-center justify-between gap-2 p-3 text-xs" role="status">
        <span className="text-muted-foreground">{job.progress ?? job.label}</span>
        <span className="font-mono tabular-nums text-primary">
          {`${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`}
        </span>
      </div>
    </div>
  )
}
