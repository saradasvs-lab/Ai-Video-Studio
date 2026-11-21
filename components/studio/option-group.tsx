'use client'

import { cn } from '@/lib/utils'

export function OptionGroup<T extends string | number>({
  label,
  name,
  options,
  value,
  onChange,
  render,
}: {
  label: string
  name: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  render?: (option: T) => React.ReactNode
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const selected = option === value
          return (
            <label
              key={String(option)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                selected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <input
                type="radio"
                name={name}
                checked={selected}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {render ? render(option) : option}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function AspectGlyph({ ratio }: { ratio: string }) {
  const [w, h] = ratio.split(':').map(Number)
  const scale = 14 / Math.max(w, h)
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block rounded-[2px] border border-current"
        style={{ width: w * scale, height: h * scale }}
      />
      {ratio}
    </span>
  )
}
