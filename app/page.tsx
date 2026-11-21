import { Hero } from '@/components/home/hero'
import { ModelStrip } from '@/components/home/model-strip'
import { PresetGrid } from '@/components/home/preset-grid'
import { FeatureGrid } from '@/components/home/feature-grid'
import { SiteFooter } from '@/components/site-footer'

export default function HomePage() {
  return (
    <>
      <main>
        <Hero />
        <ModelStrip />
        <PresetGrid />
        <FeatureGrid />
      </main>
      <SiteFooter />
    </>
  )
}
