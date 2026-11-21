import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { VISITOR_COOKIE } from '@/lib/visitor'

const UUID_PATTERN = /^[0-9a-f-]{36}$/i

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value
  const isValid = existing && UUID_PATTERN.test(existing)
  const id = isValid ? existing : crypto.randomUUID()

  const response = NextResponse.next()

  if (!isValid) {
    response.cookies.set(VISITOR_COOKIE, id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 2,
    })
  }

  // Upsert visitor row in Neon
  event.waitUntil(
    sql`INSERT INTO visitors (id) VALUES (${id})
        ON CONFLICT (id) DO UPDATE SET last_seen = now(), visits = visitors.visits + 1`.catch(
      (error) => console.error('Visitor tracking failed:', error),
    ),
  )

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
