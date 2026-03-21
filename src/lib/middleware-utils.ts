import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Buscar perfil do usuário para validar role e assinatura
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    const path = url.pathname

    // 1. Proteção de Rota /admin (Apenas super-admin)
    if (path.startsWith('/admin')) {
      if (profile?.role !== 'super-admin') {
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }

    // 2. Proteção de Assinatura (Apenas para tenant-admin e user, se não for super-admin)
    if (profile?.role !== 'super-admin') {
       if (profile?.subscription_status !== 'active' && path !== '/assinatura-vencida' && !path.startsWith('/_next') && !path.startsWith('/api')) {
          url.pathname = '/assinatura-vencida'
          return NextResponse.redirect(url)
       }
    }
  }

  return response
}
