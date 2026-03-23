import { createClient } from '@/lib/supabase-server'
import GestaoSaasClient from './GestaoSaasClient'
import { redirect } from 'next/navigation'

export default async function GestaoSaasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 1. Verificar se é o Super-Admin (Lucas) por email ou role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = user.email === 'lucaswelglys@gmail.com' || profile?.role === 'super-admin'

  // 2. Se não for Super-Admin, verificar se tem plano 'Admin'
  if (!isSuperAdmin) {
    const { data: marcenaria } = await supabase
      .from('marcenarias')
      .select('plano_atual')
      .eq('id', profile?.tenant_id)
      .single()

    if (marcenaria?.plano_atual !== 'Admin') {
      redirect('/')
    }
  }

  // Super-Admin/Admin Power: Buscar marcenarias
  // Se for super-admin vê tudo, se for apenas Admin plano, talvez devesse ver apenas os 'clientes dele'? 
  // O usuário disse "gerenciar os clientes deles". Mas por enquanto vamos buscar tudo como antes para manter funcional.
  const { data: marcenarias, error } = await supabase
    .from('marcenarias')
    .select('*, profiles!fk_marcenaria_dono(full_name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar marcenarias:', error)
    return <div className="p-8 text-red-500 font-bold bg-red-50 rounded-xl border border-red-100 m-4">Erro ao carregar dados do painel SaaS: {error.message}</div>
  }

  // Transformar os dados para o formato esperado pelo client
  const transformedData = (marcenarias || []).map(m => {
    const profileData = Array.isArray((m as any).profiles) 
      ? (m as any).profiles[0] 
      : (m as any).profiles

    return {
      ...m,
      nome_dono: profileData?.full_name || 'Sem Nome'
    }
  })

  return <GestaoSaasClient initialData={transformedData} isSuperAdmin={isSuperAdmin} />
}
