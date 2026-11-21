import { NextResponse } from 'next/server'
import { sql, type Generation } from '@/lib/db'
import { ASPECT_RATIOS, findVideoModel } from '@/lib/models'
import { fetchGeneratedFile, gradioImage, hfPredict } from '@/lib/hf'
import { getVisitorId } from '@/lib/visitor'
import { saveFile, makePathname } from '@/lib/storage'

export const maxDuration = 800

type Body = {
  prompt?: string
  model?: string
  aspectRatio?: string
  duration?: number
  image?: string
  sequenceId?: string
}

const SEQUENCE_PATTERN = /^[0-9a-f-]{36}$/i
const CANVAS: Record<string, string> = {
  '16:9': '1280x704 · 16:9',
  '9:16': '768x1344 · 9:16 full',
  '1:1': '768x768 · 1:1 full',
  '4:3': '1024x768 · 4:3 full',
  '3:4': '768x1024 · 3:4 full',
}
const VIDEO_SIZE: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '1:1': { width: 1024, height: 1024 },
  '4:3': { width: 1152, height: 864 },
  '3:4': { width: 864, height: 1152 },
}

async function generateWithSpace({
  model,
  prompt,
  aspectRatio,
  duration,
  image,
}: {
  model: NonNullable<ReturnType<typeof findVideoModel>>
  prompt: string
  aspectRatio: string
  duration: number
  image?: string
}) {
  const reference = image ? gradioImage(image) : null
  let inputs: unknown[]

  if (model.id === 'minimax/minimax-h3-turbo') {
    inputs = [
      prompt, reference, null,
      CANVAS[aspectRatio] ?? CANVAS['16:9'],
      duration, 25, -1, false, 'lightx2v_4step',
      [], null, 1, null, 'none', null, null, '', null,
    ]
  } else {
    const { width, height } = VIDEO_SIZE[aspectRatio] ?? VIDEO_SIZE['16:9']
    inputs = [prompt, reference, height, width, duration, 42, 'conv', false, true, true]
  }

  const result = await hfPredict({
    spaceUrl: model.hfSpace,
    apiName: model.hfApiName,
    inputs,
    timeoutMs: 740_000,
    token: process.env.HF_TOKEN,
  })
  return fetchGeneratedFile(model.hfSpace, result.data[0], 'video/mp4', process.env.HF_TOKEN)
}

export async function POST(request: Request) {
  const visitorId = await getVisitorId()
  if (!visitorId) {
    return NextResponse.json({ error: 'Please reload the page and try again.' }, { status: 400 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const prompt = body.prompt?.trim() ?? ''
  const model = findVideoModel(body.model ?? '')
  if (!prompt || prompt.length > 4000) {
    return NextResponse.json({ error: 'Enter a prompt (up to 4000 characters).' }, { status: 400 })
  }
  if (!model) {
    return NextResponse.json({ error: 'Unknown model.' }, { status: 400 })
  }
  if (body.image && body.image.length > 3_500_000) {
    return NextResponse.json({ error: 'Reference image is too large.' }, { status: 413 })
  }

  const duration = model.durations.includes(Number(body.duration))
    ? Number(body.duration)
    : model.durations[0]
  const aspectRatio = ASPECT_RATIOS.find((ratio) => ratio === body.aspectRatio) ?? '16:9'
  const sequenceId =
    body.sequenceId && SEQUENCE_PATTERN.test(body.sequenceId) ? body.sequenceId : null

  try {
    const { bytes, contentType } = await generateWithSpace({
      model,
      prompt,
      aspectRatio,
      duration,
      image: model.imageId ? body.image : undefined,
    })
    const extension = contentType.includes('webm') ? 'webm' : 'mp4'
    const pathname = makePathname(visitorId, 'video', extension)
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
      { error: 'This model is temporarily unavailable. Try again later or choose another model.' },
      { status: 502 },
    )
  }
}
