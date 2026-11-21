export type Preset = {
  id: string
  name: string
  kind: 'image' | 'video'
  tag: string
  /** Path to a static image, or null to use the CSS gradient fallback */
  image: string | null
  /** CSS gradient used when `image` is null */
  gradient: string
  prompt: string
}

export const PRESETS: Preset[] = [
  {
    id: 'crash-zoom',
    name: 'Crash Zoom',
    kind: 'video',
    tag: 'Camera move',
    image: null,
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #e94560 100%)',
    prompt:
      'Extreme fast crash zoom pushing in from a wide shot to a tight close-up of the subject, motion blur streaks, high energy, cinematic',
  },
  {
    id: 'bullet-time',
    name: 'Bullet Time',
    kind: 'video',
    tag: 'Camera move',
    image: null,
    gradient: 'linear-gradient(135deg, #0d0d0d 0%, #1a0533 40%, #3d1a78 70%, #7b2fff 100%)',
    prompt:
      'Bullet-time effect: time freezes mid-action while the camera sweeps 180 degrees around the subject, suspended particles, dramatic rim light',
  },
  {
    id: 'orbit',
    name: '360 Orbit',
    kind: 'video',
    tag: 'Camera move',
    image: null,
    gradient: 'linear-gradient(135deg, #0a2342 0%, #1565c0 50%, #42a5f5 80%, #fff9c4 100%)',
    prompt:
      'Smooth 360 degree orbit around the subject at low angle, golden sunset light, cinematic commercial look, stabilized gimbal motion',
  },
  {
    id: 'liquid-chrome',
    name: 'Liquid Chrome',
    kind: 'video',
    tag: 'VFX',
    image: null,
    gradient:
      'linear-gradient(135deg, #000000 0%, #1c1c1c 25%, #c0c0c0 50%, #f8f8f8 75%, #a8a8a8 100%)',
    prompt:
      'The subject slowly transforms into flowing liquid chrome metal, iridescent reflections rippling across the surface, black background',
  },
  {
    id: 'neon-noir',
    name: 'Neon Noir',
    kind: 'image',
    tag: 'Look',
    image: null,
    gradient: 'linear-gradient(135deg, #0d001a 0%, #1a0030 30%, #3d0066 60%, #ff00cc 90%, #00ffff 100%)',
    prompt:
      'Neon noir film still, rain-soaked alley, magenta and cyan neon reflections, shallow depth of field, moody cinematic lighting',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    kind: 'image',
    tag: 'Look',
    image: null,
    gradient: 'linear-gradient(135deg, #1a0a00 0%, #7c3a00 30%, #d4700a 60%, #ffd700 85%, #fff4c2 100%)',
    prompt:
      'Golden hour editorial portrait, warm backlight, soft atmospheric haze, Kodak Portra film look, natural skin texture',
  },
  {
    id: 'miniature',
    name: 'Tiny World',
    kind: 'image',
    tag: 'Style',
    image: null,
    gradient: 'linear-gradient(135deg, #e8f5e9 0%, #81c784 30%, #2e7d32 60%, #1b5e20 100%)',
    prompt:
      'Tilt-shift miniature diorama, tiny detailed figures, macro photography look, shallow focus band, playful toy-like scale',
  },
  {
    id: 'anime',
    name: 'Painted Anime',
    kind: 'image',
    tag: 'Style',
    image: null,
    gradient: 'linear-gradient(135deg, #1a237e 0%, #7b1fa2 30%, #ff6f00 60%, #fff8e1 100%)',
    prompt:
      'Hand-painted anime film style, lush painterly backgrounds, cel shading, dramatic sky, warm dusk palette',
  },
]

export function findPreset(id: string | undefined) {
  return id ? PRESETS.find((p) => p.id === id) : undefined
}
