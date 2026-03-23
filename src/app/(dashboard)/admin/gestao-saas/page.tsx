import { createClient } from '@/lib/supabase-server'
import GestaoSaasClient from './GestaoSaasClient'
import { redirect } from 'next/navigation'

export default async function GestaoSaasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'lucaswelglys@gmail.com') {
    redirect('/')
  }

  // Super-Admin Power: Buscar TODAS as marcenarias ignorando filtros de tenant
  const { data: marcenarias, error } = await supabase
    .from('marcenarias')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar marcenarias:', error)
    return <div>Erro ao carregar dados do painel SaaS.</div>
  }

  return <GestaoSaasClient initialData={marcenarias || []} />
}
