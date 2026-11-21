import { cookies } from 'next/headers'

export const VISITOR_COOKIE = 'af_vid'

const UUID_PATTERN = /^[0-9a-f-]{36}$/i

export async function getVisitorId() {
  const id = (await cookies()).get(VISITOR_COOKIE)?.value
  return id && UUID_PATTERN.test(id) ? id : null
}
