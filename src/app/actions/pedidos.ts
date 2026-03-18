'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function converterParaContrato(pedidoId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('pedidos')
    .update({ 
      status: 'fechado',
      data_fechamento: new Date().toISOString().split('T')[0]
    })
    .eq('id', pedidoId)

  if (error) {
    console.error('Erro ao converter pedido:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/financeiro')
  
  return { success: true }
}
