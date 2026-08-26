import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Password-gate the studio.
 * - /studio (the builder UI) always requires the password.
 * - /api/cases write requests (POST/PUT/DELETE) require it too.
 * - /api/upload requires it.
 * - GET /api/cases stays public so the site can read content.
 * - /api/health is public but only answers with a bare liveness result unless
 *   the caller authenticates; the scheduled keep-alive ping has to reach it
 *   without credentials, or Appwrite's free tier pauses the project.
 *
 * Set STUDIO_PASSWORD in the environment (Vercel → Settings → Environment
 * Variables). Locally, if it's unset the gate is skipped for convenience.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isStudio = pathname.startsWith('/studio')
  const isWrite = pathname.startsWith('/api/cases') && req.method !== 'GET'
  const isUpload = pathname.startsWith('/api/upload')
  if (!isStudio && !isWrite && !isUpload) return NextResponse.next()

  const password = process.env.STUDIO_PASSWORD
  if (!password) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Studio disabled: STUDIO_PASSWORD is not set.', { status: 503 })
    }
    return NextResponse.next()
  }

  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Basic ')) {
    try {
      const [, pwd] = atob(auth.slice(6)).split(':')
      if (pwd === password) return NextResponse.next()
    } catch {
      /* fall through to challenge */
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Darwin Studio"' },
  })
}

export const config = {
  matcher: ['/studio/:path*', '/api/cases', '/api/cases/:path*', '/api/upload'],
}
