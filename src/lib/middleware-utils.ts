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
      .select('role, subscription_status, tenant_id')
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

    // 3. Validação de Status da Marcenaria (Kill Switch & God Mode)
    // Buscamos o status da marcenaria vinculada
    const { data: marcenaria } = await supabase
      .from('marcenarias')
      .select('status_conta, acesso_temporario_ate')
      .eq('id', profile?.tenant_id)
      .single()

    const now = new Date()
    const isTempAccessActive = marcenaria?.acesso_temporario_ate 
      ? new Date(marcenaria.acesso_temporario_ate) > now 
      : false

    // Se a conta estiver aguardando aprovação
    const isPending = marcenaria?.status_conta === 'PENDING_APPROVAL'
    if (isPending && !path.startsWith('/status')) {
      url.pathname = '/status/aguardando-aprovacao'
      return NextResponse.redirect(url)
    }

    // Se a conta estiver bloqueada ou inadimplente, e NÃO houver acesso temporário
    const isBlocked = marcenaria?.status_conta === 'blocked' || marcenaria?.status_conta === 'past_due'
    
    if (isBlocked && !isTempAccessActive && !path.startsWith('/status')) {
      url.pathname = '/status/bloqueado'
      return NextResponse.redirect(url)
    }

    // 4. Proteção de Rota /admin (Apenas super-admin)
    if (path.startsWith('/admin')) {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // 5. Lógica de Bloqueio de Assinatura (Legacy/Profile - Backup)
    if (profile && profile.subscription_status !== 'active' && !path.startsWith('/status')) {
       url.pathname = '/assinatura-vencida'
       return NextResponse.redirect(url)
    }
  }

  return response
}
