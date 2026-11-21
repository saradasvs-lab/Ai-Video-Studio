export type ImageModel = {
  id: string
  name: string
  vendor: string
  description: string
  supportsReference: boolean
  badge?: string
  /** HuggingFace Space URL for free generation */
  hfSpace?: string
  /** Gradio API name on that Space */
  hfApiName?: string
}

export type VideoModel = {
  id: string
  imageId?: string
  name: string
  vendor: string
  description: string
  durations: number[]
  audio: boolean
  badge?: string
  /** HuggingFace Space URL for free generation */
  hfSpace?: string
  /** Gradio API name on that Space */
  hfApiName?: string
}

// ── Image models ──────────────────────────────────────────────────────────────
// Free models are backed by public HF Spaces via the Gradio async API.
// Paid model slots are kept in the list so the UI renders correctly; the
// generate route will return a helpful error if no HF Space is wired up.

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'bfl/flux-1-schnell',
    name: 'FLUX.1 Schnell',
    vendor: 'Black Forest Labs',
    description: 'Ultra-fast photorealistic generation – best for rapid iteration.',
    supportsReference: false,
    badge: 'Free · Fast',
    hfSpace: 'https://black-forest-labs-flux-1-schnell.hf.space',
    hfApiName: '/infer',
  },
  {
    id: 'bfl/flux-2-dev',
    name: 'FLUX.2 Dev',
    vendor: 'Black Forest Labs',
    description: 'High-fidelity detail with balanced speed – the workhorse for stills.',
    supportsReference: false,
    badge: 'Free',
    hfSpace: 'https://black-forest-labs-flux-2-dev.hf.space',
    hfApiName: '/infer',
  },
  {
    id: 'minimax/minimax-h3-image',
    name: 'Hailuo H3 Image',
    vendor: 'MiniMax',
    description: 'Expressive characters and anime aesthetics.',
    supportsReference: false,
    badge: 'Free',
    hfSpace: 'https://minimaxai-minimax-h3-image.hf.space',
    hfApiName: '/generate_image',
  },
  {
    id: 'bfl/flux-2-max',
    name: 'Flux 2 Max',
    vendor: 'Black Forest Labs',
    description: 'Photoreal detail with multi-reference control.',
    supportsReference: true,
    badge: 'Photoreal',
  },
  {
    id: 'bfl/flux-kontext-max',
    name: 'Flux Kontext Max',
    vendor: 'Black Forest Labs',
    description: 'Edit and restyle an image you upload.',
    supportsReference: true,
    badge: 'Editing',
  },
  {
    id: 'openai/gpt-image-2',
    name: 'GPT Image 2',
    vendor: 'OpenAI',
    description: 'Precise prompt following, text rendering, and edits.',
    supportsReference: true,
    badge: 'Best overall',
  },
  {
    id: 'bytedance/seedream-5.5',
    name: 'Seedream 5.5',
    vendor: 'ByteDance',
    description: 'Vivid, high-resolution creative imagery.',
    supportsReference: true,
  },
  {
    id: 'recraft/recraft-v4.1-pro',
    name: 'Recraft V4.1 Pro',
    vendor: 'Recraft',
    description: 'Design-grade illustration, posters, and brand art.',
    supportsReference: false,
  },
]

// ── Video models ──────────────────────────────────────────────────────────────

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: 'minimax/minimax-h3',
    name: 'Hailuo H3',
    vendor: 'MiniMax',
    description: 'Expressive physics and VFX-heavy shots.',
    durations: [6, 10],
    audio: false,
    badge: 'Free',
    hfSpace: 'https://observantdistressed-minimax-h3-turbo.hf.space',
    hfApiName: '/predict',
  },
  {
    id: 'ltx/ltx-2-5',
    name: 'LTX Video 2.5',
    vendor: 'Lightricks',
    description: 'Detailed scenes with strong prompt adherence.',
    durations: [5, 8, 12],
    audio: false,
    badge: 'Free',
    hfSpace: 'https://iis007-ltx-2-5-video-studio.hf.space',
    hfApiName: '/generate_video',
  },
  {
    id: 'google/veo-3.1-generate-001',
    name: 'Veo 3.1',
    vendor: 'Google',
    description: 'Cinematic realism with native sound and dialogue.',
    durations: [4, 6, 8],
    audio: true,
    badge: 'With audio',
  },
  {
    id: 'klingai/kling-v3.0-t2v',
    imageId: 'klingai/kling-v3.0-i2v',
    name: 'Kling 3.0',
    vendor: 'Kling AI',
    description: 'Fluid human motion and dynamic camera moves.',
    durations: [5, 10],
    audio: false,
    badge: 'Motion',
  },
  {
    id: 'bytedance/seedance-2.5',
    name: 'Seedance 2.5',
    vendor: 'ByteDance',
    description: 'Multi-shot storytelling with consistent subjects.',
    durations: [5, 10],
    audio: false,
  },
  {
    id: 'alibaba/wan-v2.6-t2v',
    imageId: 'alibaba/wan-v2.6-i2v',
    name: 'Wan 2.6',
    vendor: 'Alibaba',
    description: 'Detailed scenes with strong prompt adherence.',
    durations: [5, 10],
    audio: false,
  },
]

export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4'] as const
export type AspectRatio = (typeof ASPECT_RATIOS)[number]

export const MAX_SEQUENCE_SECONDS = 180

export function findImageModel(id: string) {
  return IMAGE_MODELS.find((m) => m.id === id)
}

export function findVideoModel(id: string) {
  return VIDEO_MODELS.find((m) => m.id === id)
}

export function modelName(id: string) {
  return findImageModel(id)?.name ?? findVideoModel(id)?.name ?? id
}
