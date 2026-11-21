import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p>
          <span className="font-semibold tracking-[0.2em] text-foreground">AETHERFIELD</span>
          {' — image & video creative studio'}
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/library" className="hover:text-foreground">
            Library
          </Link>
          <Link href="/stats" className="hover:text-foreground">
            Visitor stats
          </Link>
        </nav>
      </div>
    </footer>
  )
}
