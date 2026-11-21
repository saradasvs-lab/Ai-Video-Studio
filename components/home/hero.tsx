import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Clapperboard, ImageIcon } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <Image
        src="/images/hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-background/10"
      />
      <div className="mx-auto flex min-h-[78vh] max-w-[1600px] flex-col justify-end gap-6 px-4 pb-14 pt-32 md:px-6 md:pb-20">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
          AI creative studio
        </p>
        <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
          Direct anything. Pay nothing.
        </h1>
        <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          Cinematic video sequences up to 3 minutes and studio-grade images from the best frontier
          models. No credits, no watermark, no sign-up.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/video"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Clapperboard className="size-4" aria-hidden="true" />
            Create video
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/image"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-secondary"
          >
            <ImageIcon className="size-4" aria-hidden="true" />
            Create image
          </Link>
        </div>
      </div>
    </section>
  )
}
