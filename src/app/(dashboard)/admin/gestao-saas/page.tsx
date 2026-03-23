import { createClient } from '@/lib/supabase-server'
import GestaoSaasClient from './GestaoSaasClient'
import { redirect } from 'next/navigation'

export default async function GestaoSaasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'lucaswelglys@gmail.com') {
    redirect('/')
  }

  // Super-Admin Power: Buscar TODAS as marcenarias com dados do dono
  const { data: marcenarias, error } = await supabase
    .from('marcenarias')
    .select(`
      *,
      profiles!fk_marcenaria_dono(full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar marcenarias:', error)
    return <div className="p-8 text-red-500 font-bold bg-red-50 rounded-xl border border-red-100 m-4">Erro ao carregar dados do painel SaaS: {error.message}</div>
  }

  // Transformar os dados para o formato esperado pelo client
  const transformedData = (marcenarias || []).map(m => {
    const profile = Array.isArray((m as any).profiles) 
      ? (m as any).profiles[0] 
      : (m as any).profiles

    return {
      ...m,
      nome_dono: profile?.full_name || 'Sem Nome'
    }
  })

  return <GestaoSaasClient initialData={transformedData} />
}
