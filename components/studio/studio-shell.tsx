import { DemoCreditBalance } from './demo-credit-balance'

export function StudioShell({
  title,
  panel,
  children,
}: {
  title: string
  panel: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-6 lg:flex-row lg:items-start">
      <aside
        aria-label={`${title} controls`}
        className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:w-[380px] lg:shrink-0 lg:overflow-y-auto"
      >
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
            Aetherfield / Creative suite
          </p>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        </div>
        <DemoCreditBalance />
        {panel}
      </aside>
      <section aria-label="My generations" className="min-w-0 flex-1">
        {children}
      </section>
    </main>
  )
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
    >
      {children}
    </label>
  )
}
