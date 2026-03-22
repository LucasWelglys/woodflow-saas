'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function toggleMarcenariaStatus(id: string, newStatus: 'active' | 'blocked' | 'trial' | 'past_due') {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  // Verificação básica de segurança
  if (user?.email !== 'lucaswelglys@gmail.com') {
    return { success: false, error: 'Não autorizado' }
  }

  const { error } = await supabase
    .from('marcenarias')
    .update({ status_conta: newStatus })
    .eq('id', id)

  if (error) {
    console.error('Erro ao alternar status:', error)
    return { success: false, error }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function grantTemporaryAccess(id: string, hours: number) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== 'lucaswelglys@gmail.com') {
    return { success: false, error: 'Não autorizado' }
  }

  const expiration = new Date()
  expiration.setHours(expiration.getHours() + hours)

  const { data, error } = await supabase
    .from('marcenarias')
    .update({ acesso_temporario_ate: expiration.toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao conceder acesso temporário:', error)
    return { success: false, error }
  }

  revalidatePath('/admin')
  return { success: true, data }
}
