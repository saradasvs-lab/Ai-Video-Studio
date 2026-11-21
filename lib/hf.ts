/**
 * Gradio async predict helper for HuggingFace Spaces.
 *
 * Uses the Gradio 4.x queue / event-stream API so long-running generations
 * don't hit Vercel's function timeout:
 *   POST /gradio_api/call/<api_name>  → { event_id }
 *   GET  /gradio_api/call/<api_name>/<event_id>  → SSE stream with output events
 *
 * The caller supplies process.env.HF_TOKEN which is forwarded as a bearer token.
 */

export type HFPredictOptions = {
  /** HF Space URL, e.g. "https://black-forest-labs-flux-1-schnell.hf.space" */
  spaceUrl: string
  /** Gradio API name, e.g. "/predict" or "/infer" */
  apiName: string
  /** Positional inputs matching the Space's input components */
  inputs: unknown[]
  /** Bearer token – set via process.env.HF_TOKEN */
  token?: string
  /** Max milliseconds to wait for a result (default 180_000 = 3 min) */
  timeoutMs?: number
}

export type HFPredictResult = {
  /** Raw output array from the Space */
  data: unknown[]
}

/**
 * Calls a Gradio Space endpoint using the async queue API and returns the
 * first "complete" event's data.  Throws on error or timeout.
 */
export async function hfPredict(opts: HFPredictOptions): Promise<HFPredictResult> {
  const { spaceUrl, apiName, inputs, token, timeoutMs = 180_000 } = opts

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  // ── Step 1: submit the prediction ─────────────────────────────────────────
  const submitUrl = `${spaceUrl}/gradio_api/call${apiName}`
  const submitRes = await fetch(submitUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: inputs }),
  })

  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => '')
    throw new Error(`HF submit failed (${submitRes.status}): ${text.slice(0, 200)}`)
  }

  const { event_id } = (await submitRes.json()) as { event_id: string }
  if (!event_id) throw new Error('HF Space did not return an event_id')

  // ── Step 2: poll the SSE stream for the result ─────────────────────────────
  const pollUrl = `${spaceUrl}/gradio_api/call${apiName}/${event_id}`
  const deadline = Date.now() + timeoutMs

  const streamRes = await fetch(pollUrl, { headers })
  if (!streamRes.ok || !streamRes.body) {
    throw new Error(`HF poll failed (${streamRes.status})`)
  }

  const reader = streamRes.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (Date.now() < deadline) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // keep incomplete last line

    let eventName = ''
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        const payload = line.slice(5).trim()
        if (eventName === 'complete') {
          reader.cancel().catch(() => {})
          const parsed = JSON.parse(payload) as unknown[]
          return { data: parsed }
        }
        if (eventName === 'error') {
          throw new Error(`HF generation error: ${payload.slice(0, 300)}`)
        }
      }
    }
  }

  reader.cancel().catch(() => {})
  throw new Error('HF generation timed out')
}

/**
 * Fetches a URL and returns the raw bytes as a Buffer.
 * Used to download the generated image/video from the HF Space's file server.
 */
export async function fetchBytes(url: string, token?: string): Promise<Buffer> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`fetchBytes failed (${res.status}) for ${url}`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

/**
 * Given a Gradio output value that may be a string URL, an object with a `url`
 * field, or a base-64 data URI, normalise it to { url, isDataUri }.
 */
export function normaliseGradioFile(val: unknown): { url: string; isDataUri: boolean } {
  if (typeof val === 'string') {
    if (val.startsWith('data:')) return { url: val, isDataUri: true }
    return { url: val, isDataUri: false }
  }
  if (typeof val === 'object' && val !== null && 'url' in val) {
    const url = (val as { url: string }).url
    if (url.startsWith('data:')) return { url, isDataUri: true }
    return { url, isDataUri: false }
  }
  throw new Error(`Cannot normalise Gradio file value: ${JSON.stringify(val).slice(0, 100)}`)
}
