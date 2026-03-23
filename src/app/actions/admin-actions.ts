'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function toggleMarcenariaStatus(id: string, newStatus: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
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
  revalidatePath('/admin/gestao-saas')
  return { success: true }
}

export async function grantTemporaryAccess(id: string, dateIso: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== 'lucaswelglys@gmail.com') {
    return { success: false, error: 'Não autorizado' }
  }

  const { data, error } = await supabase
    .from('marcenarias')
    .update({ acesso_temporario_ate: dateIso })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Erro ao conceder acesso temporário:', error)
    return { success: false, error }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/gestao-saas')
  return { success: true, data }
}
export async function createMarcenaria(data: { nome: string; email: string; telefone: string; plano: string; status: string }) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  // 1. Verificar se quem está criando tem permissão de super-admin ou plano Admin (para criar clientes comuns)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = user.email === 'lucaswelglys@gmail.com' || profile?.role === 'super-admin'

  // Se não for super admin, verificar se ele tem o plano Admin para poder gerenciar a base dele
  if (!isSuperAdmin) {
    const { data: requesterMarcenaria } = await supabase
      .from('marcenarias')
      .select('plano_atual')
      .eq('id', profile?.tenant_id)
      .single()

    if (requesterMarcenaria?.plano_atual !== 'Admin') {
      return { success: false, error: 'Não autorizado' }
    }
  }

  // 2. Trava de Segurança Backend: Se o plano enviado for 'Admin', APENAS o super-admin original pode criar
  if (data.plano === 'Admin' && user.email !== 'lucaswelglys@gmail.com') {
    return { success: false, error: 'Apenas o Super-Admin original pode criar contas com o plano Admin' }
  }

  // 3. Executar a criação (No mundo real, isso pode envolver criar usuário no Auth e etc. 
  // Por enquanto vamos apenas inserir na tabela marcenarias para fins de exibição no dashboard)
  const { error } = await supabase
    .from('marcenarias')
    .insert({
      nome_marcenaria: data.nome, // Usando nome como nome da marcenaria por enquanto
      plano_atual: data.plano,
      status_conta: data.status.toLowerCase() === 'active' ? 'active' : 'inactive',
      acesso_temporario_ate: null
    })

  if (error) {
    console.error('Erro ao criar marcenaria:', error)
    return { success: false, error }
  }

  revalidatePath('/admin/gestao-saas')
  return { success: true }
}
