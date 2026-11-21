import { NextResponse, type NextRequest, type NextFetchEvent } from 'next/server'
import { sql } from '@/lib/db'
import { VISITOR_COOKIE } from '@/lib/visitor'
import crypto from 'crypto'

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const response = NextResponse.next()

  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    })
  }

  event.waitUntil(
    sql`
      INSERT INTO visitors (id) VALUES (${visitorId})
      ON CONFLICT (id) DO UPDATE SET last_seen = now(), visits = visitors.visits + 1
    `.catch((e) => console.error('Visitor upsert failed:', e)),
  )

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
