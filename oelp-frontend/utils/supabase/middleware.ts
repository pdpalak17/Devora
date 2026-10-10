import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public/auth routes don't need a user lookup. Skipping it avoids refreshing
  // stale cookies on the login and OAuth callback pages before code exchange.
  if (
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/landing.html' ||
    pathname.startsWith('/auth/')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createMiddlewareClient({ 
    req: request, 
    res: response 
  })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Supabase may refresh an expired session here. Forward those refreshed
  // cookies to both the browser and the downstream Server Components. Without
  // updating the request cookies, Server Components receive the old refresh
  // token and race the middleware to refresh it again.
  const refreshedCookies = response.cookies.getAll()
  for (const cookie of refreshedCookies) {
    if (cookie.maxAge === 0) {
      request.cookies.delete(cookie.name)
    } else {
      request.cookies.set(cookie.name, cookie.value)
    }
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/landing.html') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    for (const cookie of refreshedCookies) {
      if (cookie.maxAge === 0) {
        redirectResponse.cookies.delete(cookie.name)
      } else {
        redirectResponse.cookies.set(cookie)
      }
    }
    return redirectResponse
  }

  const updatedResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  for (const cookie of refreshedCookies) {
    if (cookie.maxAge === 0) {
      updatedResponse.cookies.delete(cookie.name)
    } else {
      updatedResponse.cookies.set(cookie)
    }
  }
  return updatedResponse
}
