'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Explore' },
  { href: '/image', label: 'Image' },
  { href: '/video', label: 'Video' },
  { href: '/library', label: 'Library' },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 md:gap-8 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-[0.22em]"
        >
          <span aria-hidden="true" className="size-2.5 rounded-full bg-primary" />
          <span className="hidden sm:inline">AETHERFIELD</span>
          <span className="sr-only sm:hidden">Aetherfield home</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <span className="ml-auto hidden rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground md:inline">
          {'Free · No credits · No watermark'}
        </span>
      </div>
    </header>
  )
}
