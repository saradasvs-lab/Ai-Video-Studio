'use client'

import { useId, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { FieldLabel } from './studio-shell'

const MAX_EDGE = 1536

async function downscale(file: File) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.9)
}

export function ReferenceUpload({
  label,
  value,
  onChange,
  disabledReason,
}: {
  label: string
  value: string | null
  onChange: (dataUrl: string | null) => void
  disabledReason?: string
}) {
  const inputId = useId()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      {disabledReason ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
          {disabledReason}
        </p>
      ) : value ? (
        <div className="relative w-fit">
          <img src={value} alt="Reference" className="h-24 rounded-xl border border-border object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove reference image"
            className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-1 hover:bg-secondary"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          Upload image (optional)
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              try {
                setError(null)
                onChange(await downscale(file))
              } catch {
                setError('Could not read that image.')
              }
            }}
          />
        </label>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
