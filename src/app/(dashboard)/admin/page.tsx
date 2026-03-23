import { createClient } from '@/lib/supabase-server'
import AdminDashboard from './AdminDashboard'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'lucaswelglys@gmail.com') {
    redirect('/')
  }

  const { data: marcenarias, error } = await supabase
    .from('marcenarias')
    .select('*, profiles!fk_marcenaria_dono(full_name)')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Erro ao buscar marcenarias:', error)
    return <div>Erro ao carregar dados.</div>
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminDashboard marcenarias={marcenarias || []} />
    </div>
  )
}
