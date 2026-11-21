'use client'

import { useRef, useState } from 'react'
import {
  ASPECT_RATIOS,
  MAX_SEQUENCE_SECONDS,
  VIDEO_MODELS,
  findVideoModel,
  type AspectRatio,
} from '@/lib/models'
import { useGenerations } from '@/lib/use-generations'
import { StudioShell, FieldLabel } from './studio-shell'
import { PromptField } from './prompt-field'
import { ModelPicker } from './model-picker'
import { AspectGlyph, OptionGroup } from './option-group'
import { ReferenceUpload } from './reference-upload'
import { GenerateButton } from './generate-button'
import { GenerationFeed, type PendingJob } from './generation-feed'

const MODES = ['Single clip', 'Long sequence'] as const
type Mode = (typeof MODES)[number]

function shotPrompt(base: string, beats: string[], index: number, total: number, seconds: number) {
  const beat = beats.length ? beats[Math.floor((index * beats.length) / total)] : ''
  const position =
    index === 0
      ? 'Opening shot of the sequence.'
      : index === total - 1
        ? 'Final shot: bring the sequence to a satisfying close.'
        : 'Continue directly from the previous shot.'
  return [
    base,
    beat && `This shot: ${beat}`,
    `Shot ${index + 1} of ${total} in one continuous ${seconds}-second film. ${position} Keep the same characters, wardrobe, setting, lighting, color grade, and visual style throughout.`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function VideoStudio({ initialPrompt }: { initialPrompt: string }) {
  const { generations, isLoading, mutate, remove } = useGenerations('video')
  const [prompt, setPrompt] = useState(initialPrompt)
  const [modelId, setModelId] = useState(VIDEO_MODELS[0].id)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [durationChoice, setDurationChoice] = useState(8)
  const [mode, setMode] = useState<Mode>('Single clip')
  const [totalSeconds, setTotalSeconds] = useState(60)
  const [beats, setBeats] = useState('')
  const [audio, setAudio] = useState(true)
  const [image, setImage] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingJob[]>([])
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const model = findVideoModel(modelId)!
  const maxDuration = model.durations[model.durations.length - 1]
  const duration = model.durations.includes(durationChoice) ? durationChoice : maxDuration
  const shotLength = mode === 'Long sequence' ? maxDuration : duration
  const shots = mode === 'Long sequence' ? Math.ceil(totalSeconds / shotLength) : 1
  const beatList = beats
    .split('\n')
    .map((b) => b.trim())
    .filter(Boolean)

  async function requestClip(body: Record<string, unknown>) {
    const res = await fetch('/api/generate/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Video generation failed.')
  }

  async function generate() {
    if (!prompt.trim()) return
    setError(null)
    const jobId = crypto.randomUUID()
    const sequenceId = shots > 1 ? crypto.randomUUID() : undefined
    const snapshot = {
      model: modelId,
      aspectRatio,
      duration: shotLength,
      audio,
      image: model.imageId ? image?.split(',')[1] : undefined,
    }
    const update = (progress: string) =>
      setPending((jobs) => jobs.map((j) => (j.id === jobId ? { ...j, progress } : j)))

    setPending((jobs) => [
      {
        id: jobId,
        label: `Rendering with ${model.name}`,
        aspectRatio: image ? '16:9' : aspectRatio,
        slots: 1,
        startedAt: Date.now(),
        progress: shots > 1 ? `Shot 1 of ${shots}` : undefined,
      },
      ...jobs,
    ])

    let completed = 0
    try {
      for (let i = 0; i < shots; i++) {
        if (shots > 1) update(`Shot ${i + 1} of ${shots} · ${model.name}`)
        await requestClip({
          ...snapshot,
          prompt: shots > 1 ? shotPrompt(prompt, beatList, i, shots, shots * shotLength) : prompt,
          image: i === 0 ? snapshot.image : undefined,
          sequenceId,
        })
        completed++
        await mutate()
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Video generation failed.'
      setError(shots > 1 ? `${message} (${completed} of ${shots} shots finished)` : message)
    } finally {
      setPending((jobs) => jobs.filter((j) => j.id !== jobId))
    }
  }

  return (
    <StudioShell
      title="Video studio"
      panel={
        <form
          ref={formRef}
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            generate()
          }}
        >
          <PromptField
            kind="video"
            value={prompt}
            onChange={setPrompt}
            onSubmit={() => formRef.current?.requestSubmit()}
            placeholder="Slow dolly-in on a samurai standing in falling cherry blossoms, wind in the trees..."
          />
          <ModelPicker models={VIDEO_MODELS} value={modelId} onChange={setModelId} />
          <OptionGroup label="Length" name="mode" options={MODES} value={mode} onChange={setMode} />

          {mode === 'Single clip' ? (
            <OptionGroup
              label="Duration"
              name="duration"
              options={model.durations}
              value={duration}
              onChange={setDurationChoice}
              render={(d) => `${d}s`}
            />
          ) : (
            <div className="flex flex-col gap-4 rounded-xl border border-border p-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="total-seconds">Total length</FieldLabel>
                  <span className="font-mono text-sm tabular-nums">
                    {`${Math.floor((shots * shotLength) / 60)}:${String((shots * shotLength) % 60).padStart(2, '0')}`}
                  </span>
                </div>
                <input
                  id="total-seconds"
                  type="range"
                  min={shotLength * 2}
                  max={MAX_SEQUENCE_SECONDS}
                  step={shotLength}
                  value={Math.min(MAX_SEQUENCE_SECONDS, Math.max(shotLength * 2, totalSeconds))}
                  onChange={(e) => setTotalSeconds(Number(e.target.value))}
                  className="accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  {`${shots} shots × ${shotLength}s, rendered in order and played back as one film.`}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="beats">Story beats (optional, one per line)</FieldLabel>
                <textarea
                  id="beats"
                  value={beats}
                  onChange={(e) => setBeats(e.target.value)}
                  rows={4}
                  placeholder={'She walks into the rain\nClose-up as she looks up\nWide shot of the neon city'}
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
                />
              </div>
            </div>
          )}

          <OptionGroup
            label="Aspect ratio"
            name="aspect"
            options={ASPECT_RATIOS}
            value={aspectRatio}
            onChange={setAspectRatio}
            render={(r) => <AspectGlyph ratio={r} />}
          />
          <ReferenceUpload
            label="Start frame (image to video)"
            value={image}
            onChange={setImage}
            disabledReason={
              model.imageId
                ? undefined
                : `${model.name} is text-to-video only. Pick Veo, Kling, Seedance, or Wan to animate an image.`
            }
          />
          {model.audio && (
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm">
              Native audio &amp; dialogue
              <input
                type="checkbox"
                checked={audio}
                onChange={(e) => setAudio(e.target.checked)}
                className="size-4 accent-primary"
              />
            </label>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <GenerateButton disabled={!prompt.trim()}>
            {shots > 1 ? `Generate ${shots}-shot sequence` : `Generate ${duration}s video`}
          </GenerateButton>
        </form>
      }
    >
      <GenerationFeed
        generations={generations}
        pending={pending}
        isLoading={isLoading}
        onDelete={remove}
        onReuse={setPrompt}
        emptyText="Your videos will appear here. Single clips take 1–3 minutes; long sequences render shot by shot."
      />
    </StudioShell>
  )
}
