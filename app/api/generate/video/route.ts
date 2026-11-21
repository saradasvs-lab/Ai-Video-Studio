import { NextResponse } from 'next/server'
import { sql, type Generation } from '@/lib/db'
import { ASPECT_RATIOS, findVideoModel } from '@/lib/models'
import { getVisitorId } from '@/lib/visitor'
import { hfPredict, fetchBytes, normaliseGradioFile } from '@/lib/hf'
import { saveFile, makePathname } from '@/lib/storage'

export const maxDuration = 800

type Body = {
  prompt?: string
  model?: string
  aspectRatio?: string
  duration?: number
  image?: string
  audio?: boolean
  sequenceId?: string
}

const SEQUENCE_PATTERN = /^[0-9a-f-]{36}$/i

function aspectToWH(ratio: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    '16:9': { width: 1280, height: 720 },
    '9:16': { width: 720, height: 1280 },
    '1:1': { width: 768, height: 768 },
    '4:3': { width: 1024, height: 768 },
    '3:4': { width: 768, height: 1024 },
  }
  return map[ratio] ?? { width: 1280, height: 720 }
}

async function generateMinimaxVideo(opts: {
  prompt: string
  spaceUrl: string
  apiName: string
  aspectRatio: string
  duration: number
  token?: string
}): Promise<{ bytes: Buffer; contentType: string }> {
  const { width, height } = aspectToWH(opts.aspectRatio)
  const resolution = `${width}x${height}`
  const result = await hfPredict({
    spaceUrl: opts.spaceUrl,
    apiName: opts.apiName,
    inputs: [opts.prompt, resolution, opts.duration],
    token: opts.token,
    timeoutMs: 600_000,
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
  return { bytes, contentType: 'video/mp4' }
}

async function generateLTX(opts: {
  prompt: string
  spaceUrl: string
  apiName: string
  aspectRatio: string
  duration: number
  token?: string
}): Promise<{ bytes: Buffer; contentType: string }> {
  const { width, height } = aspectToWH(opts.aspectRatio)
  const frames = opts.duration * 25
  const result = await hfPredict({
    spaceUrl: opts.spaceUrl,
    apiName: opts.apiName,
    inputs: [opts.prompt, 'worst quality, inconsistent', width, height, frames, 0, 3.0, 30],
    token: opts.token,
    timeoutMs: 600_000,
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
  return { bytes, contentType: 'video/mp4' }
}

async function generateViaHF(opts: {
  model: ReturnType<typeof findVideoModel> & object
  prompt: string
  aspectRatio: string
  duration: number
  token?: string
}): Promise<{ bytes: Buffer; contentType: string }> {
  const { model, prompt, aspectRatio, duration, token } = opts
  const spaceUrl = (model as { hfSpace: string }).hfSpace
  const apiName = (model as { hfApiName: string }).hfApiName
  if (model.id === 'minimax/minimax-h3') {
    return generateMinimaxVideo({ prompt, spaceUrl, apiName, aspectRatio, duration, token })
  }
  if (model.id === 'ltx/ltx-2-5') {
    return generateLTX({ prompt, spaceUrl, apiName, aspectRatio, duration, token })
  }
  const result = await hfPredict({ spaceUrl, apiName, inputs: [prompt, duration], token, timeoutMs: 600_000 })
  const fileVal = Array.isArray(result.data) ? result.data[0] : result.data
  const { url, isDataUri } = normaliseGradioFile(fileVal)
  if (isDataUri) {
    const [header, b64] = url.split(',')
    const contentType = header.replace('data:', '').replace(';base64', '')
    return { bytes: Buffer.from(b64, 'base64'), contentType }
  }
  const absUrl = url.startsWith('http') ? url : `${spaceUrl}${url}`
  const bytes = await fetchBytes(absUrl, token)
  return { bytes, contentType: 'video/mp4' }
}

export async function POST(request: Request) {
  const visitorId = await getVisitorId()
  if (!visitorId) {
    return NextResponse.json({ error: 'Please reload the page and try again.' }, { status: 400 })
  }

  const body = (await request.json()) as Body
  const prompt = body.prompt?.trim() ?? ''
  const model = findVideoModel(body.model ?? '')

  if (!prompt || prompt.length > 4000) {
    return NextResponse.json({ error: 'Enter a prompt (up to 4000 characters).' }, { status: 400 })
  }
  if (!model) {
    return NextResponse.json({ error: 'Unknown model.' }, { status: 400 })
  }

  const hfSpace = (model as { hfSpace?: string }).hfSpace
  if (!hfSpace) {
    return NextResponse.json(
      { error: `${model.name} requires an API key. Choose a free model to generate videos for free.` },
      { status: 402 },
    )
  }

  const duration = model.durations.includes(Number(body.duration))
    ? Number(body.duration)
    : model.durations[0]
  const aspectRatio = ASPECT_RATIOS.find((r) => r === body.aspectRatio) ?? '16:9'
  const sequenceId =
    body.sequenceId && SEQUENCE_PATTERN.test(body.sequenceId) ? body.sequenceId : null

  const token = process.env.HF_TOKEN

  try {
    const { bytes, contentType } = await generateViaHF({
      model: model as Parameters<typeof generateViaHF>[0]['model'],
      prompt,
      aspectRatio,
      duration,
      token,
    })

    const pathname = makePathname(visitorId, 'video', 'mp4')
    await saveFile(pathname, bytes)

    const rows = (await sql`
      INSERT INTO generations (visitor_id, kind, model, prompt, pathname, content_type, aspect_ratio, duration, sequence_id)
      VALUES (${visitorId}, 'video', ${model.id}, ${prompt}, ${pathname}, ${contentType}, ${aspectRatio}, ${duration}, ${sequenceId})
      RETURNING id, kind, model, prompt, content_type, aspect_ratio, duration, sequence_id, created_at
    `) as Generation[]

    return NextResponse.json({ generation: rows[0] })
  } catch (error) {
    console.error('Video generation failed:', error)
    return NextResponse.json(
      { error: 'Video generation failed. The HF Space may be starting up – try again in 60 seconds.' },
      { status: 500 },
    )
  }
}
