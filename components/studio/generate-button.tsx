import { Sparkles } from 'lucide-react'

export function GenerateButton({
  disabled,
  children,
}: {
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-1.5 border-t border-border bg-card p-4">
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        {children}
      </button>
      <p className="text-center font-mono text-[11px] text-muted-foreground">
        {'Free · No credits · Ctrl/⌘ + Enter'}
      </p>
    </div>
  )
}
