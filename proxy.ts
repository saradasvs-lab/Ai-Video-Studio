import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'

const VISITOR_COOKIE = 'af_vid'

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value
  const id = existing ?? crypto.randomUUID()

  const headers = new Headers(request.headers)
  if (!existing) {
    const cookieHeader = request.headers.get('cookie')
    headers.set(
      'cookie',
      [cookieHeader, `${VISITOR_COOKIE}=${id}`].filter(Boolean).join('; '),
    )
  }

  const response = NextResponse.next({ request: { headers } })

  if (!existing) {
    response.cookies.set(VISITOR_COOKIE, id, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 * 2,
    })
  }

  event.waitUntil(
    sql`INSERT INTO visitors (id) VALUES (${id})
        ON CONFLICT (id) DO UPDATE SET last_seen = now(), visits = visitors.visits + 1`.catch(
      (error) => console.error('Visitor tracking failed:', error),
    ),
  )

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico|.*\\..*).*)'],
}
