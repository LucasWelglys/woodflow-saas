'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function marcarComoPago(parcelaId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('parcelas')
    .update({ 
      status: 'pago',
      data_recebimento: new Date().toISOString().split('T')[0]
    })
    .eq('id', parcelaId)

  if (error) {
    console.error('Erro detalhado no Supabase:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/financeiro')
  revalidatePath('/dashboard/financeiro/vencidos')
  
  return { success: true }
}
