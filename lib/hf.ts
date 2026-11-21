export type GradioFile = {
  url?: string | null
  path?: string | null
  mime_type?: string | null
  orig_name?: string | null
  size?: number | null
  meta?: { _type?: string }
}

export type HfPrediction = {
  data: unknown[]
}

function apiUrl(spaceUrl: string, pathname: string) {
  const base = new URL(spaceUrl)
  if (base.protocol !== 'https:') throw new Error('Hugging Face Spaces must use HTTPS.')
  return new URL(`/gradio_api/call/${pathname.replace(/^\/+/, '')}`, base)
}

export async function hfPredict({
  spaceUrl,
  apiName,
  inputs,
  timeoutMs,
  token,
}: {
  spaceUrl: string
  apiName: string
  inputs: unknown[]
  timeoutMs: number
  token?: string
}): Promise<HfPrediction> {
  const signal = AbortSignal.timeout(timeoutMs)
  const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' })
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const submit = await fetch(apiUrl(spaceUrl, apiName), {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: inputs }),
    signal,
  })

  if (!submit.ok) {
    const detail = (await submit.text()).slice(0, 240)
    throw new Error(`Hugging Face Space rejected the request (${submit.status}). ${detail}`)
  }

  const { event_id: eventId } = (await submit.json()) as { event_id?: string }
  if (!eventId) throw new Error('Hugging Face Space did not return a queue event ID.')

  const queueUrl = apiUrl(spaceUrl, `${apiName.replace(/^\/+/, '')}/${encodeURIComponent(eventId)}`)
  const queueHeaders = new Headers({ Accept: 'text/event-stream' })
  if (token) queueHeaders.set('Authorization', `Bearer ${token}`)
  const response = await fetch(queueUrl, {
    headers: queueHeaders,
    signal,
  })
  if (!response.ok || !response.body) {
    throw new Error(`Could not read the Hugging Face generation queue (${response.status}).`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let eventName = ''
  let dataLines: string[] = []

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim())
        } else if (!line.trim()) {
          const payload = dataLines.join('\n')
          if (eventName === 'complete') {
            return { data: JSON.parse(payload) as unknown[] }
          }
          if (eventName === 'error') {
            if (!payload || payload === 'null') {
              throw new Error(
                'This free Hugging Face Space returned no result. Its daily GPU quota may be exhausted; wait for the quota reset or try again later.',
              )
            }
            if (payload.includes('ZeroGPU quota exceeded')) {
              throw new Error(
                token
                  ? 'This Hugging Face Space has exhausted its GPU quota for the current token. Try another model or retry after the quota resets.'
                  : 'Hugging Face free GPU quota is exhausted. Add HF_TOKEN to the project and retry.',
              )
            }
            throw new Error(`Hugging Face generation failed: ${payload.slice(0, 240)}`)
          }
          eventName = ''
          dataLines = []
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('The Hugging Face Space timed out while generating. Try again shortly.')
    }
    throw error
  } finally {
    await reader.cancel().catch(() => undefined)
  }

  throw new Error('The Hugging Face Space closed the queue before returning a result.')
}

export function gradioImage(dataUrl: string): GradioFile {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/.exec(dataUrl)
  if (!match) throw new Error('Reference images must be JPEG, PNG, or WebP data URLs.')
  const mimeType = match[1]
  const base64 = match[2]
  return {
    url: dataUrl,
    mime_type: mimeType,
    orig_name: `reference.${mimeType.split('/')[1]}`,
    size: Math.floor((base64.length * 3) / 4),
    meta: { _type: 'gradio.FileData' },
  }
}

export function normaliseGradioFile(value: unknown): {
  url: string
  contentType?: string
} {
  if (typeof value === 'string') return { url: value }
  if (value && typeof value === 'object') {
    const file = value as GradioFile
    const url = file.url || file.path
    if (typeof url === 'string') {
      return { url, contentType: file.mime_type ?? undefined }
    }
  }
  throw new Error('The Hugging Face Space returned an unsupported media file.')
}

export async function fetchGeneratedFile(
  spaceUrl: string,
  value: unknown,
  fallbackContentType: string,
  token?: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  const normalized = normaliseGradioFile(value)
  if (normalized.url.startsWith('data:')) {
    const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(normalized.url)
    if (!match) throw new Error('The Hugging Face Space returned invalid image data.')
    return {
      bytes: Buffer.from(match[2], 'base64'),
      contentType: normalized.contentType ?? match[1],
    }
  }

  const base = new URL(spaceUrl)
  const fileUrl = normalized.url.startsWith('http')
    ? new URL(normalized.url)
    : normalized.url.startsWith('/gradio_api/file=')
      ? new URL(normalized.url, base)
      : new URL(`/gradio_api/file=${encodeURIComponent(normalized.url)}`, base)

  if (
    fileUrl.protocol !== 'https:' ||
    (fileUrl.hostname !== base.hostname && !fileUrl.hostname.endsWith('.hf.space'))
  ) {
    throw new Error('The Hugging Face Space returned a file URL outside its trusted host.')
  }

  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(fileUrl, { headers })
  if (!response.ok) throw new Error(`Could not download generated media (${response.status}).`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.byteLength === 0) throw new Error('The Hugging Face Space returned an empty file.')

  return {
    bytes,
    contentType:
      normalized.contentType ?? response.headers.get('content-type') ?? fallbackContentType,
  }
}
