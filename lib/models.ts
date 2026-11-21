export type ImageModel = {
  id: string
  name: string
  vendor: string
  description: string
  supportsReference: boolean
  hfSpace: string
  hfApiName: string
  badge?: string
}

export type VideoModel = {
  id: string
  imageId?: string
  name: string
  vendor: string
  description: string
  durations: number[]
  audio: boolean
  hfSpace: string
  hfApiName: string
  badge?: string
}

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: 'bfl/flux-1-schnell',
    name: 'FLUX.1 Schnell',
    vendor: 'Black Forest Labs',
    description: 'Fast text-to-image generation, typically just a few steps.',
    supportsReference: false,
    badge: 'Fast',
    hfSpace: 'https://black-forest-labs-flux-1-schnell.hf.space',
    hfApiName: '/infer',
  },
  {
    id: 'bfl/flux-2-dev',
    name: 'FLUX.2 Dev',
    vendor: 'Black Forest Labs',
    description: 'Detailed image generation with reference-image support.',
    supportsReference: true,
    badge: 'Image + reference',
    hfSpace: 'https://black-forest-labs-flux-2-dev.hf.space',
    hfApiName: '/infer',
  },
  {
    id: 'minimax/minimax-h3-image',
    name: 'MiniMax H3 Image',
    vendor: 'MiniMax',
    description: 'High-detail image generation with optional image guidance.',
    supportsReference: true,
    hfSpace: 'https://minimaxai-minimax-h3-image.hf.space',
    hfApiName: '/generate',
  },
]

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: 'minimax/minimax-h3-turbo',
    imageId: 'minimax/minimax-h3-turbo',
    name: 'MiniMax H3 Turbo',
    vendor: 'MiniMax',
    description: 'Cinematic clips with a synchronized soundtrack.',
    durations: [2, 5, 8, 14],
    audio: false,
    badge: 'With sound',
    hfSpace: 'https://observantdistressed-minimax-h3-turbo.hf.space',
    hfApiName: '/generate',
  },
  {
    id: 'ltx/ltx-2-5',
    imageId: 'ltx/ltx-2-5',
    name: 'LTX 2.5 Video',
    vendor: 'LTX',
    description: 'Prompt-led motion with optional image-to-video guidance.',
    durations: [2, 4, 5],
    audio: false,
    badge: 'Image to video',
    hfSpace: 'https://iis007-ltx-2-5-video-studio.hf.space',
    hfApiName: '/run',
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
