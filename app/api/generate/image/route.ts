import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { sql, type Generation } from '@/lib/db'
import { ASPECT_RATIOS, findImageModel } from '@/lib/models'
import { getVisitorId } from '@/lib/visitor'
import { hfPredict, fetchBytes, normaliseGradioFile } from '@/lib/hf'

// Vercel function timeout – give generous room for HF generation
export const maxDuration = 300

type Body = {
  prompt?: string
  model?: string
  aspectRatio?: string
  count?: number
  referenceImage?: string
}

// ── Aspect-ratio helpers ───────────────────────────────────────────────────────

/** Convert "16:9" → width/height pair that most Gradio Spaces accept */
function aspectToSize(ratio: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    '16:9': { width: 1360, height: 768 },
    '9:16': { width: 768, height: 1360 },
    '1:1': { width: 1024, height: 1024 },
    '4:3': { width: 1152, height: 864 },
    '3:4': { width: 864, height: 1152 },
  }
  return map[ratio] ?? { width: 1024, height: 1024 }
}

// ── FLUX.1-schnell / FLUX.2-dev  (Black Forest Labs spaces) ───────────────────
// API: /infer(prompt, seed, randomize_seed, width, height, guidance_scale, num_inference_steps)
// Returns: [{url: ...}, seed]
async function generateFlux(opts: {
  prompt: string
  spaceUrl: string
  apiName: string
  aspectRatio: string
  token?: string
}): Promise<{ bytes: Buffer; contentType: string }> {
  const { width, height } = aspectToSize(opts.aspectRatio)
  const result = await hfPredict({
    spaceUrl: opts.spaceUrl,
    apiName: opts.apiName,
    inputs: [
      opts.prompt,  // prompt
      0,            // seed
      true,         // randomize_seed
      width,        // width
      height,       // height
      3.5,          // guidance_scale (schnell ignores this but space accepts it)
      4,            // num_inference_steps
    ],
    token: opts.token,
  })

  const fileVal = Array.isArray(result.data) ? result.data[0] : result.data
  const { url, isDataUri } = normaliseGradioFile(fileVal)

  if (isDataUri) {
    // data:image/webp;base64,....
    const [header, b64] = url.split(',')
    const contentType = header.replace('data:', '').replace(';base64', '')
    return { bytes: Buffer.from(b64, 'base64'), contentType }
  }

  // Resolve relative paths the Space may return
  const absUrl = url.startsWith('http') ? url : `${opts.spaceUrl}${url}`
  const bytes = await fetchBytes(absUrl, opts.token)
  return { bytes, contentType: 'image/webp' }
}

// ── MiniMax H3 Image ──────────────────────────────────────────────────────────
// API: /generate_image(prompt, aspect_ratio)
// Returns: [{url: ...}]
async function generateMinimaxImage(opts: {
  prompt: string
  spaceUrl: string
  apiName: string
  aspectRatio: string
  token?: string
}): Promise<{ bytes: Buffer; contentType: string }> {
  // Map our aspect ratio strings to what MiniMax expects
  const arMap: Record<string, string> = {
    '16:9': '16:9',
    '9:16': '9:16',
    '1:1': '1:1',
    '4:3': '4:3',
    '3:4': '3:4',
  }
  const ar = arMap[opts.aspectRatio] ?? '1:1'

  const result = await hfPredict({
    spaceUrl: opts.spaceUrl,
    apiName: opts.apiName,
    inputs: [opts.prompt, ar],
    token: opts.token,
  })

  const fileVal = Array.isArray(result.data) ? result.data[0] : result.data
  const { url, isDataUri } = normaliseGradioFile(fileVal)

  if (isDataUri) {
    const [header, b64] = url.split(',')
    const contentType = header.replace('data:', '').replace(';base64', '')
    return { bytes: Buffer.from(b64, 'base64'), contentType }
  }

  const absUrl = url.startsWith('http') ? url : `${opts.spaceUrl}${url}`
  const bytes = await fetchBytes(absUrl, opts.token)
  return { bytes, contentType: 'image/jpeg' }
}

// ── Generic dispatcher ─────────────────────────────────────────────────────────

async function generateViaHF(opts: {
  model: ReturnType<typeof findImageModel> & object
  prompt: string
  aspectRatio: string
  token?: string
}): Promise<{ bytes: Buffer; contentType: string }> {
  const { model, prompt, aspectRatio, token } = opts
  const spaceUrl = (model as { hfSpace: string }).hfSpace
  const apiName = (model as { hfApiName: string }).hfApiName

  if (model.id.startsWith('bfl/flux')) {
    return generateFlux({ prompt, spaceUrl, apiName, aspectRatio, token })
  }
  if (model.id === 'minimax/minimax-h3-image') {
    return generateMinimaxImage({ prompt, spaceUrl, apiName, aspectRatio, token })
  }

  // Fallback: try generic /predict with [prompt]
  const result = await hfPredict({ spaceUrl, apiName, inputs: [prompt], token })
  const fileVal = Array.isArray(result.data) ? result.data[0] : result.data
  const { url, isDataUri } = normaliseGradioFile(fileVal)
  if (isDataUri) {
    const [header, b64] = url.split(',')
    const contentType = header.replace('data:', '').replace(';base64', '')
    return { bytes: Buffer.from(b64, 'base64'), contentType }
  }
  const absUrl = url.startsWith('http') ? url : `${spaceUrl}${url}`
  const bytes = await fetchBytes(absUrl, token)
  return { bytes, contentType: 'image/webp' }
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const visitorId = await getVisitorId()
  if (!visitorId) {
    return NextResponse.json({ error: 'Please reload the page and try again.' }, { status: 400 })
  }

  const body = (await request.json()) as Body
  const prompt = body.prompt?.trim() ?? ''
  const model = findImageModel(body.model ?? '')
  const aspectRatio = ASPECT_RATIOS.find((r) => r === body.aspectRatio) ?? '1:1'
  const count = Math.min(4, Math.max(1, Math.floor(Number(body.count) || 1)))

  if (!prompt || prompt.length > 4000) {
    return NextResponse.json({ error: 'Enter a prompt (up to 4000 characters).' }, { status: 400 })
  }
  if (!model) {
    return NextResponse.json({ error: 'Unknown model.' }, { status: 400 })
  }

  // Check whether this model has a free HF backend
  const hfSpace = (model as { hfSpace?: string }).hfSpace
  if (!hfSpace) {
    return NextResponse.json(
      {
        error: `${model.name} requires an API key. Choose a free model (FLUX.1 Schnell, FLUX.2 Dev, or Hailuo H3) to generate images for free.`,
      },
      { status: 402 },
    )
  }

  const token = process.env.HF_TOKEN

  try {
    const saved: Generation[] = []

    // Generate `count` images in parallel (capped at 4)
    const tasks = Array.from({ length: count }, () =>
      generateViaHF({ model: model as Parameters<typeof generateViaHF>[0]['model'], prompt, aspectRatio, token }),
    )
    const results = await Promise.all(tasks)

    for (const { bytes, contentType } of results) {
      const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png'
      const blob = await put(
        `ai-video-studio/${visitorId}/image-${crypto.randomUUID()}.${extension}`,
        bytes,
        { access: 'private', contentType },
      )
      const rows = (await sql`
        INSERT INTO generations (visitor_id, kind, model, prompt, pathname, content_type, aspect_ratio)
        VALUES (${visitorId}, 'image', ${model.id}, ${prompt}, ${blob.pathname}, ${contentType}, ${aspectRatio})
        RETURNING id, kind, model, prompt, content_type, aspect_ratio, duration, sequence_id, created_at
      `) as Generation[]
      saved.push(rows[0])
    }

    return NextResponse.json({ generations: saved })
  } catch (error) {
    console.error('Image generation failed:', error)
    return NextResponse.json(
      { error: 'Generation failed. The HF Space may be asleep – try again in 30 seconds, or choose a different model.' },
      { status: 500 },
    )
  }
}
