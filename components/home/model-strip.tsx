import { IMAGE_MODELS, VIDEO_MODELS } from '@/lib/models'

export function ModelStrip() {
  return (
    <section aria-labelledby="models-heading" className="border-b border-border">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-12 md:px-6 lg:flex-row lg:items-start lg:gap-16">
        <div className="flex shrink-0 flex-col gap-2 lg:w-64">
          <h2 id="models-heading" className="text-lg font-semibold">
            Every top model, one studio
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Switch models per generation. Same prompt, different engines.
          </p>
        </div>
        <div className="flex flex-col gap-5">
          <ModelRow label="Video" names={VIDEO_MODELS.map((m) => `${m.name} · ${m.vendor}`)} />
          <ModelRow label="Image" names={IMAGE_MODELS.map((m) => `${m.name} · ${m.vendor}`)} />
        </div>
      </div>
    </section>
  )
}

function ModelRow({ label, names }: { label: string; names: string[] }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:gap-4">
      <span className="w-14 shrink-0 font-mono text-xs uppercase tracking-widest text-primary">
        {label}
      </span>
      <ul className="flex flex-wrap gap-2">
        {names.map((name) => (
          <li
            key={name}
            className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  )
}
