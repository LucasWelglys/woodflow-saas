'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function recalculateFinanceiro() {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('recalculate_financeiro_v1')

  if (error) {
    console.error('Erro ao recalcular financeiro:', error)
    throw new Error(`Falha no recálculo: ${error.message}`)
  }

  revalidatePath('/financeiro')
  revalidatePath('/dashboard')
  revalidatePath('/pedidos')
  
  return { success: true }
}
