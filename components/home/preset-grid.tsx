import Image from 'next/image'
import Link from 'next/link'
import { PRESETS } from '@/lib/presets'

export function PresetGrid() {
  return (
    <section aria-labelledby="presets-heading" className="border-b border-border">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 py-14 md:px-6">
        <div className="flex flex-col gap-2">
          <h2 id="presets-heading" className="text-3xl font-semibold tracking-tight md:text-4xl">
            Effects &amp; presets
          </h2>
          <p className="max-w-lg text-muted-foreground">
            One click camera moves, VFX, and looks. Pick one and make it yours.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PRESETS.map((preset) => (
            <li key={preset.id}>
              <Link
                href={`/${preset.kind}?preset=${preset.id}`}
                className="group flex flex-col gap-3 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-card">
                  <Image
                    src={preset.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-background/70 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider backdrop-blur">
                    {preset.kind}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2 px-1">
                  <span className="font-medium">{preset.name}</span>
                  <span className="text-xs text-muted-foreground">{preset.tag}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
