'use client'

import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import type { Generation } from '@/lib/db'
import { cn } from '@/lib/utils'
import { CardMeta, IconButton } from './generation-card'

export function SequenceCard({
  clips,
  onDelete,
  onReuse,
}: {
  clips: Generation[]
  onDelete: (id: number) => void
  onReuse?: (prompt: string) => void
}) {
  const [index, setIndex] = useState(0)
  const current = clips[Math.min(index, clips.length - 1)]
  const totalSeconds = clips.reduce((sum, clip) => sum + (clip.duration ?? 0), 0)
  const aspectRatio = current.aspect_ratio?.replace(':', '/')

  async function downloadAll() {
    for (const clip of clips) {
      const link = document.createElement('a')
      link.href = `/api/file/${clip.id}?download=1`
      link.download = ''
      link.click()
      await new Promise((resolve) => setTimeout(resolve, 400))
    }
  }

  return (
    <figure className="mb-3 flex break-inside-avoid flex-col overflow-hidden rounded-xl border border-primary/40 bg-card">
      <video
        key={current.id}
        src={`/api/file/${current.id}`}
        controls
        playsInline
        autoPlay={index > 0}
        preload="metadata"
        onEnded={() => index < clips.length - 1 && setIndex(index + 1)}
        className="block w-full bg-black"
        style={{ aspectRatio }}
      />
      <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2" role="group" aria-label="Shots">
        {clips.map((clip, i) => (
          <button
            key={clip.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Play shot ${i + 1}`}
            aria-pressed={i === index}
            className={cn(
              'h-6 min-w-6 shrink-0 rounded-md px-1.5 font-mono text-[11px] transition-colors',
              i === index ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <CardMeta
        generation={clips[0]}
        onReuse={onReuse}
        extra={`Sequence · ${clips.length} shots · ${totalSeconds}s`}
      >
        <IconButton label="Download all shots" onClick={downloadAll}>
          <Download className="size-4" aria-hidden="true" />
        </IconButton>
        <IconButton
          label="Delete sequence"
          onClick={() => clips.forEach((clip) => onDelete(clip.id))}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </IconButton>
      </CardMeta>
    </figure>
  )
}
