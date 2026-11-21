import { Film, Infinity as InfinityIcon, Layers, ShieldCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: InfinityIcon,
    title: 'Completely free',
    body: 'No credits, no plans, no paywalls. Generate as much as you like.',
  },
  {
    icon: Film,
    title: 'Up to 3-minute video',
    body: 'Chain shots into long-form sequences that play back as one film.',
  },
  {
    icon: ShieldCheck,
    title: 'No watermark',
    body: 'Download clean, full-resolution files ready for any project.',
  },
  {
    icon: Layers,
    title: '16 frontier models',
    body: 'Veo, Kling, Seedance, GPT Image, Flux, Seedream and more.',
  },
]

export function FeatureGrid() {
  return (
    <section aria-label="Why Aetherfield">
      <ul className="mx-auto grid max-w-[1600px] gap-3 px-4 py-14 sm:grid-cols-2 md:px-6 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <Icon className="size-5 text-primary" aria-hidden="true" />
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
