'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getMarcenariaContext } from '@/lib/marcenaria'

export async function recalculateFinanceiro() {
  const supabase = createClient()
  
  const marcenaria = await getMarcenariaContext()
  if (!marcenaria) {
    throw new Error('Marcenaria não encontrada ou usuário não autenticado')
  }

  // Tenta rodar via RPC primeiro
  const { data: rpcCount, error: rpcError } = await supabase.rpc('recalculate_financeiro_v1', {
    p_marcenaria_id: marcenaria.id
  })

  let count = rpcCount || 0

  // Se o RPC falhar, tenta o fallback manual via código
  if (rpcError) {
    console.warn('RPC falhou, tentando fallback:', rpcError)
    
    const { error: updateError, data } = await supabase
      .from('parcelas')
      .update({ updated_at: new Date().toISOString() })
      .eq('marcenaria_id', marcenaria.id)
      .select('id')

    if (updateError) {
      console.error('Erro no fallback do recálculo:', updateError)
      throw new Error(`Falha no recálculo (RPC & Fallback): ${updateError.message}`)
    }

    count = data?.length || 0
  }

  if (count === 0) {
    return { success: true, count: 0, message: 'Nenhuma parcela encontrada para recálculo.' }
  }

  revalidatePath('/financeiro')
  revalidatePath('/dashboard')
  revalidatePath('/pedidos')
  
  return { success: true, count }
}
