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

  const url = request.nextUrl.clone()
  const path = url.pathname

  // 1. Lista de Rotas Públicas (Bypass imediato)
  const isPublicRoute = 
    path === '/login' || 
    path === '/assinatura-vencida' || 
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.startsWith('/assets') ||
    path.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)

  if (isPublicRoute) {
    return response
  }

  if (user) {
    // 1.5 Passe Livre por Email (Segurança Extra para o Dono)
    if (user.email === 'lucaswelglys@gmail.com') {
      console.log(`[Middleware] Super Admin Bypass por Email: ${user.email}`)
      return response
    }

    // Buscar perfil do usuário para validar role e assinatura
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', user.id)
      .single()

    // Debug Logs detalhados
    console.log(`[Middleware] UID: ${user.id} | Email: ${user.email} | Path: ${path}`)
    console.log(`[Middleware] Profile Result:`, profile)
    if (error) console.error(`[Middleware] Erro ao buscar perfil:`, error)

    // 2. O "Passe Livre" do Dono (Super Admin vê TUDO via Role)
    if (profile?.role === 'super-admin') {
      return response
    }

    // 3. Proteção de Rota /admin (Apenas super-admin - se chegou aqui não é super-admin)
    if (path.startsWith('/admin')) {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // 4. Lógica de Bloqueio de Assinatura (Apenas se NÃO for super-admin)
    if (profile && profile.subscription_status !== 'active') {
       url.pathname = '/assinatura-vencida'
       return NextResponse.redirect(url)
    }
  }

  return response
}
