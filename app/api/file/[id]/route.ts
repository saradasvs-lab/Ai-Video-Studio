import { NextResponse, type NextRequest } from 'next/server'
import { get } from '@vercel/blob'
import { sql } from '@/lib/db'
import { getVisitorId } from '@/lib/visitor'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const visitorId = await getVisitorId()
  const id = Number((await params).id)
  if (!visitorId || !Number.isInteger(id)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const rows = (await sql`
    SELECT pathname, kind FROM generations WHERE id = ${id} AND visitor_id = ${visitorId}
  `) as { pathname: string; kind: string }[]
  if (!rows[0]) return new NextResponse('Not found', { status: 404 })

  const result = await get(rows[0].pathname, {
    access: 'private',
    ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
  })
  if (!result) return new NextResponse('Not found', { status: 404 })

  if (result.statusCode === 304) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' },
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': result.blob.contentType,
    ETag: result.blob.etag,
    'Cache-Control': 'private, no-cache',
  }
  if (request.nextUrl.searchParams.get('download') === '1') {
    const extension = rows[0].pathname.split('.').pop()
    headers['Content-Disposition'] = `attachment; filename="aetherfield-${id}.${extension}"`
  }

  return new NextResponse(result.stream, { headers })
}
