import type { Metadata } from 'next'
import { ImageStudio } from '@/components/studio/image-studio'
import { findPreset } from '@/lib/presets'

export const metadata: Metadata = { title: 'Image studio — Aetherfield' }

export default async function ImagePage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>
}) {
  const { preset } = await searchParams
  return <ImageStudio initialPrompt={findPreset(preset)?.prompt ?? ''} />
}
