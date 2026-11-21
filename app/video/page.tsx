import type { Metadata } from 'next'
import { VideoStudio } from '@/components/studio/video-studio'
import { findPreset } from '@/lib/presets'

export const metadata: Metadata = { title: 'Video studio — Aetherfield' }

export default async function VideoPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>
}) {
  const { preset } = await searchParams
  return <VideoStudio initialPrompt={findPreset(preset)?.prompt ?? ''} />
}
