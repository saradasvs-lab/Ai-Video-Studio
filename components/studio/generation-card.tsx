'use client'

import { useState } from 'react'
import { Check, Copy, Download, RotateCcw, Trash2 } from 'lucide-react'
import type { Generation } from '@/lib/db'
import { modelName } from '@/lib/models'

export function GenerationCard({
  generation,
  onDelete,
  onReuse,
}: {
  generation: Generation
  onDelete: (id: number) => void
  onReuse?: (prompt: string) => void
}) {
  const src = `/api/file/${generation.id}`
  const aspectRatio = generation.aspect_ratio?.replace(':', '/')

  return (
    <figure className="mb-3 flex break-inside-avoid flex-col overflow-hidden rounded-xl border border-border bg-card">
      {generation.kind === 'image' ? (
        <img
          src={src}
          alt={generation.prompt}
          loading="lazy"
          className="block h-auto w-full bg-muted"
          style={{ aspectRatio }}
        />
      ) : (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          className="block w-full bg-black"
          style={{ aspectRatio }}
        />
      )}
      <CardMeta generation={generation} onReuse={onReuse}>
        <IconLink href={`${src}?download=1`} label="Download">
          <Download className="size-4" aria-hidden="true" />
        </IconLink>
        <IconButton label="Delete" onClick={() => onDelete(generation.id)}>
          <Trash2 className="size-4" aria-hidden="true" />
        </IconButton>
      </CardMeta>
    </figure>
  )
}

export function CardMeta({
  generation,
  onReuse,
  extra,
  children,
}: {
  generation: Generation
  onReuse?: (prompt: string) => void
  extra?: string
  children?: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)

  return (
    <figcaption className="flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center gap-x-2 text-xs">
        <span className="font-mono text-primary">{modelName(generation.model)}</span>
        {extra && <span className="text-muted-foreground">{extra}</span>}
        {!extra && generation.duration && (
          <span className="text-muted-foreground">{`${generation.duration}s`}</span>
        )}
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{generation.prompt}</p>
      <div className="flex items-center gap-1">
        <IconButton
          label={copied ? 'Copied' : 'Copy prompt'}
          onClick={async () => {
            await navigator.clipboard.writeText(generation.prompt)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </IconButton>
        {onReuse && (
          <IconButton label="Reuse prompt" onClick={() => onReuse(generation.prompt)}>
            <RotateCcw className="size-4" aria-hidden="true" />
          </IconButton>
        )}
        <span className="ml-auto flex items-center gap-1">{children}</span>
      </div>
    </figcaption>
  )
}

const iconClass =
  'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground'

export function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={iconClass}>
      {children}
    </button>
  )
}

export function IconLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a href={href} download aria-label={label} title={label} className={iconClass}>
      {children}
    </a>
  )
}
