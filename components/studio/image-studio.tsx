'use client'

import { useRef, useState } from 'react'
import { ASPECT_RATIOS, IMAGE_MODELS, findImageModel, type AspectRatio } from '@/lib/models'
import { useGenerations } from '@/lib/use-generations'
import { useDemoCredits } from '@/lib/use-demo-credits'
import { StudioShell } from './studio-shell'
import { PromptField } from './prompt-field'
import { ModelPicker } from './model-picker'
import { AspectGlyph, OptionGroup } from './option-group'
import { ReferenceUpload } from './reference-upload'
import { GenerateButton } from './generate-button'
import { GenerationFeed, type PendingJob } from './generation-feed'

const COUNTS = [1, 2, 3, 4] as const

export function ImageStudio({ initialPrompt }: { initialPrompt: string }) {
  const { generations, isLoading, mutate, remove } = useGenerations('image')
  const { spend: spendCredit, mutate: mutateCredits } = useDemoCredits()
  const [prompt, setPrompt] = useState(initialPrompt)
  const [modelId, setModelId] = useState(IMAGE_MODELS[0].id)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [count, setCount] = useState<(typeof COUNTS)[number]>(2)
  const [reference, setReference] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingJob[]>([])
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const model = findImageModel(modelId)!

  async function generate() {
    if (!prompt.trim()) return
    if (!spendCredit()) {
      setError('No credits remaining. Clear your browser data to reset your 1 billion credits.')
      return
    }
    setError(null)
    const job: PendingJob = {
      id: crypto.randomUUID(),
      label: `Generating with ${model.name}`,
      aspectRatio,
      slots: count,
      startedAt: Date.now(),
    }
    setPending((jobs) => [job, ...jobs])
    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: modelId,
          aspectRatio,
          count,
          referenceImage: model.supportsReference ? reference ?? undefined : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed.')
      await mutate()
      await mutateCredits()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.')
    } finally {
      setPending((jobs) => jobs.filter((j) => j.id !== job.id))
    }
  }

  return (
    <StudioShell
      title="Image studio"
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
            kind="image"
            value={prompt}
            onChange={setPrompt}
            onSubmit={() => formRef.current?.requestSubmit()}
            placeholder="A lone astronaut in a field of glowing wildflowers at dusk, 35mm film..."
          />
          <ModelPicker models={IMAGE_MODELS} value={modelId} onChange={setModelId} />
          <OptionGroup
            label="Aspect ratio"
            name="aspect"
            options={ASPECT_RATIOS}
            value={aspectRatio}
            onChange={setAspectRatio}
            render={(r) => <AspectGlyph ratio={r} />}
          />
          <OptionGroup label="Images" name="count" options={COUNTS} value={count} onChange={setCount} />
          <ReferenceUpload
            label="Reference / edit image"
            value={reference}
            onChange={setReference}
            disabledReason={
              model.supportsReference
                ? undefined
                : `${model.name} is text-only. Choose FLUX.2 Dev or MiniMax H3 Image to use a reference.`
            }
          />
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <GenerateButton disabled={!prompt.trim()}>
            {`Generate ${count} image${count > 1 ? 's' : ''}`}
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
        emptyText="Your images will appear here. Write a prompt or tap a preset to get started."
      />
    </StudioShell>
  )
}
