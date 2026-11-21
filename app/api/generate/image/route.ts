import { NextResponse } from 'next/server'
import { sql, type Generation } from '@/lib/db'
import { ASPECT_RATIOS, findImageModel } from '@/lib/models'
import { fetchGeneratedFile, gradioImage, hfPredict } from '@/lib/hf'
import { getVisitorId } from '@/lib/visitor'
import { saveFile, makePathname } from '@/lib/storage'

export const maxDuration = 300

type Body = {
  prompt?: string
  model?: string
  aspectRatio?: string
  count?: number
  referenceImage?: string
}

function imageSize(aspectRatio: string) {
  const sizes: Record<string, { width: number; height: number }> = {
    '16:9': { width: 1024, height: 576 },
    '9:16': { width: 576, height: 1024 },
    '1:1': { width: 1024, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '3:4': { width: 768, height: 1024 },
  }
  return sizes[aspectRatio] ?? sizes['1:1']
}

async function generateWithSpace(
  model: NonNullable<ReturnType<typeof findImageModel>>,
  prompt: string,
  aspectRatio: string,
  referenceImage?: string,
) {
  const reference = referenceImage ? gradioImage(referenceImage) : undefined
  const { width, height } = imageSize(aspectRatio)
  let inputs: unknown[]

  if (model.id === 'bfl/flux-2-dev') {
    inputs = [prompt, reference ? [reference] : [], 0, true, width, height, 30, 4, true]
  } else if (model.id === 'bfl/flux-1-schnell') {
    inputs = [prompt, 0, true, width, height, 4]
  } else {
    inputs = [prompt, reference ? [reference] : [], aspectRatio, '4 MP', 0, true, false, 'low']
  }

  const result = await hfPredict({
    spaceUrl: model.hfSpace,
    apiName: model.hfApiName,
    inputs,
    timeoutMs: 270_000,
    token: process.env.HF_TOKEN,
  })
  return fetchGeneratedFile(model.hfSpace, result.data[0], 'image/png', process.env.HF_TOKEN)
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
  const model = findImageModel(body.model ?? '')
  const aspectRatio = ASPECT_RATIOS.find((ratio) => ratio === body.aspectRatio) ?? '1:1'
  const count = Math.min(4, Math.max(1, Math.floor(Number(body.count) || 1)))

  if (!prompt || prompt.length > 4000) {
    return NextResponse.json({ error: 'Enter a prompt (up to 4000 characters).' }, { status: 400 })
  }
  if (!model) {
    return NextResponse.json({ error: 'Unknown model.' }, { status: 400 })
  }
  if (body.referenceImage && body.referenceImage.length > 3_500_000) {
    return NextResponse.json({ error: 'Reference image is too large.' }, { status: 413 })
  }

  try {
    const generated = await Promise.all(
      Array.from({ length: count }, () =>
        generateWithSpace(
          model,
          prompt,
          aspectRatio,
          model.supportsReference ? body.referenceImage : undefined,
        ),
      ),
    )

    const saved: Generation[] = []
    for (const { bytes, contentType } of generated) {
      const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png'
      const pathname = makePathname(visitorId, 'image', extension)
      await saveFile(pathname, bytes)
      const rows = (await sql`
        INSERT INTO generations (visitor_id, kind, model, prompt, pathname, content_type, aspect_ratio)
        VALUES (${visitorId}, 'image', ${model.id}, ${prompt}, ${pathname}, ${contentType}, ${aspectRatio})
        RETURNING id, kind, model, prompt, content_type, aspect_ratio, duration, sequence_id, created_at
      `) as Generation[]
      saved.push(rows[0])
    }

    return NextResponse.json({ generations: saved })
  } catch (error) {
    console.error('Image generation failed:', error)
    return NextResponse.json(
      { error: 'This model is temporarily unavailable. Try again later or choose another model.' },
      { status: 502 },
    )
  }
}
