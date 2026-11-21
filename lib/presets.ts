export type Preset = {
  id: string
  name: string
  kind: 'image' | 'video'
  tag: string
  image: string
  prompt: string
}

export const PRESETS: Preset[] = [
  {
    id: 'crash-zoom',
    name: 'Crash Zoom',
    kind: 'video',
    tag: 'Camera move',
    image: '/images/preset-crash-zoom.png',
    prompt:
      'Extreme fast crash zoom pushing in from a wide shot to a tight close-up of the subject, motion blur streaks, high energy, cinematic',
  },
  {
    id: 'bullet-time',
    name: 'Bullet Time',
    kind: 'video',
    tag: 'Camera move',
    image: '/images/preset-bullet-time.png',
    prompt:
      'Bullet-time effect: time freezes mid-action while the camera sweeps 180 degrees around the subject, suspended particles, dramatic rim light',
  },
  {
    id: 'orbit',
    name: '360 Orbit',
    kind: 'video',
    tag: 'Camera move',
    image: '/images/preset-orbit.png',
    prompt:
      'Smooth 360 degree orbit around the subject at low angle, golden sunset light, cinematic commercial look, stabilized gimbal motion',
  },
  {
    id: 'liquid-chrome',
    name: 'Liquid Chrome',
    kind: 'video',
    tag: 'VFX',
    image: '/images/preset-liquid-chrome.png',
    prompt:
      'The subject slowly transforms into flowing liquid chrome metal, iridescent reflections rippling across the surface, black background',
  },
  {
    id: 'neon-noir',
    name: 'Neon Noir',
    kind: 'image',
    tag: 'Look',
    image: '/images/preset-neon-noir.png',
    prompt:
      'Neon noir film still, rain-soaked alley, magenta and cyan neon reflections, shallow depth of field, moody cinematic lighting',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    kind: 'image',
    tag: 'Look',
    image: '/images/preset-golden-hour.png',
    prompt:
      'Golden hour editorial portrait, warm backlight, soft atmospheric haze, Kodak Portra film look, natural skin texture',
  },
  {
    id: 'miniature',
    name: 'Tiny World',
    kind: 'image',
    tag: 'Style',
    image: '/images/preset-miniature.png',
    prompt:
      'Tilt-shift miniature diorama, tiny detailed figures, macro photography look, shallow focus band, playful toy-like scale',
  },
  {
    id: 'anime',
    name: 'Painted Anime',
    kind: 'image',
    tag: 'Style',
    image: '/images/preset-anime.png',
    prompt:
      'Hand-painted anime film style, lush painterly backgrounds, cel shading, dramatic sky, warm dusk palette',
  },
]

export function findPreset(id: string | undefined) {
  return id ? PRESETS.find((p) => p.id === id) : undefined
}
