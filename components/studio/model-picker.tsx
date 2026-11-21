'use client'

import { cn } from '@/lib/utils'

type ModelOption = { id: string; name: string; vendor: string; description: string; badge?: string }

export function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: ModelOption[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Model
      </legend>
      <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
        {models.map((model) => {
          const selected = model.id === value
          return (
            <label
              key={model.id}
              className={cn(
                'flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary',
              )}
            >
              <input
                type="radio"
                name="model"
                value={model.id}
                checked={selected}
                onChange={() => onChange(model.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'mt-1 size-3 shrink-0 rounded-full border',
                  selected ? 'border-primary bg-primary' : 'border-muted-foreground',
                )}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {model.name}
                  <span className="text-xs font-normal text-muted-foreground">{model.vendor}</span>
                  {model.badge && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-primary">
                      {model.badge}
                    </span>
                  )}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {model.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
