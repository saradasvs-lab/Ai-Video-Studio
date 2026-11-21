import { Film, Images, Layers, ShieldCheck, Sparkles } from 'lucide-react'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Free to explore',
    body: 'Create with available models. If a model is busy, try again later.'
  },
  {
    icon: Film,
    title: 'Long-form storytelling',
    body: 'Build multi-shot video sequences up to three minutes, rendered one scene at a time.',
  },
  {
    icon: Images,
    title: 'Image and motion',
    body: 'Explore three image models and two video models, with reference-frame support on selected models.',
  },
  {
    icon: ShieldCheck,
    title: 'Your private library',
    body: 'Generated media is saved to your browser’s private library, ready to download or remove.',
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
