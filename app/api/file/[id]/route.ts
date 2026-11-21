import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { getVisitorId } from '@/lib/visitor'
import { readFile } from '@/lib/storage'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const visitorId = await getVisitorId()
  const id = Number((await params).id)
  if (!visitorId || !Number.isInteger(id)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const rows = (await sql`
    SELECT pathname, content_type, kind FROM generations WHERE id = ${id} AND visitor_id = ${visitorId}
  `) as { pathname: string; content_type: string; kind: string }[]
  if (!rows[0]) return new NextResponse('Not found', { status: 404 })

  const bytes = await readFile(rows[0].pathname)
  if (!bytes) return new NextResponse('Not found', { status: 404 })

  const headers: Record<string, string> = {
    'Content-Type': rows[0].content_type,
    'Cache-Control': 'private, max-age=31536000',
  }

  if (request.nextUrl.searchParams.get('download') === '1') {
    const extension = rows[0].pathname.split('.').pop()
    headers['Content-Disposition'] = `attachment; filename="ai-video-studio-${id}.${extension}"`
  }

  return new NextResponse(bytes, { headers })
}
