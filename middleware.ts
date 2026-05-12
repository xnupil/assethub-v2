// middleware.ts
// Melindungi route /user/* dan /admin/* dengan auth + RBAC

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Belum login → redirect ke /login
  if (!user && (pathname.startsWith('/user') || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Sudah login → ambil role dari profiles
  if (user && (pathname.startsWith('/user') || pathname.startsWith('/admin'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'user'

    // Admin mencoba akses route user → redirect ke admin dashboard
    if (role === 'admin' && pathname.startsWith('/user')) {
      return NextResponse.redirect(new URL('/admin/approval', request.url))
    }

    // User biasa mencoba akses route admin → redirect ke katalog
    if (role === 'user' && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/user/katalog', request.url))
    }
  }

  // Sudah login tapi akses halaman login → redirect ke dashboard
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const target = profile?.role === 'admin' ? '/admin/approval' : '/user/katalog'
    return NextResponse.redirect(new URL(target, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/login', '/user/:path*', '/admin/:path*'],
}
