'use client'

import { PRESETS } from '@/lib/presets'
import { cn } from '@/lib/utils'
import { FieldLabel } from './studio-shell'

export function PromptField({
  value,
  onChange,
  onSubmit,
  kind,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  kind: 'image' | 'video'
  placeholder: string
}) {
  const presets = PRESETS.filter((p) => p.kind === kind)

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="prompt">Prompt</FieldLabel>
      <textarea
        id="prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            onSubmit()
          }
        }}
        maxLength={4000}
        rows={5}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Apply a preset">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.prompt)}
            className={cn(
              'rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground',
              value === preset.prompt && 'border-primary text-foreground',
            )}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  )
}
