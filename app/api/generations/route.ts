import { NextResponse, type NextRequest } from 'next/server'
import { del } from '@vercel/blob'
import { sql, type Generation } from '@/lib/db'
import { getVisitorId } from '@/lib/visitor'

export async function GET(request: NextRequest) {
  const visitorId = await getVisitorId()
  if (!visitorId) return NextResponse.json({ generations: [] })

  const kind = request.nextUrl.searchParams.get('kind')
  const rows = (
    kind === 'image' || kind === 'video'
      ? await sql`
          SELECT id, kind, model, prompt, content_type, aspect_ratio, duration, sequence_id, created_at
          FROM generations WHERE visitor_id = ${visitorId} AND kind = ${kind}
          ORDER BY created_at DESC LIMIT 200`
      : await sql`
          SELECT id, kind, model, prompt, content_type, aspect_ratio, duration, sequence_id, created_at
          FROM generations WHERE visitor_id = ${visitorId}
          ORDER BY created_at DESC LIMIT 200`
  ) as Generation[]

  return NextResponse.json({ generations: rows })
}

export async function DELETE(request: NextRequest) {
  const visitorId = await getVisitorId()
  const id = Number(request.nextUrl.searchParams.get('id'))
  if (!visitorId || !Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const rows = (await sql`
    DELETE FROM generations WHERE id = ${id} AND visitor_id = ${visitorId} RETURNING pathname
  `) as { pathname: string }[]

  if (rows[0]) {
    await del(rows[0].pathname).catch((error) => console.error('Blob delete failed:', error))
  }
  return NextResponse.json({ success: true })
}
