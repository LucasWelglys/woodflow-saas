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
export async function deletePedido(pedidoId: string) {
  const supabase = createClient()
  
  // Verificação de segurança: Não permitir excluir se houver parcelas pagas
  const { data: paidParcelas, error: checkError } = await supabase
    .from('parcelas')
    .select('id')
    .eq('pedido_id', pedidoId)
    .eq('status', 'pago')

  if (checkError) {
    console.error('Erro ao verificar parcelas:', checkError)
    throw new Error('Erro ao validar situação financeira do pedido.')
  }

  if (paidParcelas && paidParcelas.length > 0) {
    throw new Error('Não é possível excluir: este pedido já possui pagamentos registrados no financeiro.')
  }

  // Como não pudemos garantir o ON DELETE CASCADE via SQL, deletamos as parcelas manualmente primeiro
  const { error: parcelasError } = await supabase
    .from('parcelas')
    .delete()
    .eq('pedido_id', pedidoId)

  if (parcelasError) {
    console.error('Erro ao deletar parcelas do pedido:', parcelasError)
    throw new Error('Não foi possível excluir as parcelas relacionadas.')
  }

  const { error: pedidoError } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', pedidoId)

  if (pedidoError) {
    console.error('Erro ao deletar pedido:', pedidoError)
    throw new Error(pedidoError.message)
  }

  revalidatePath('/dashboard')
  revalidatePath('/pedidos')
  revalidatePath('/financeiro')
  
  return { success: true }
}

export async function updatePedido(pedidoId: string, data: any, parcelasData: any[]) {
  const supabase = createClient()
  
  // 1. Atualiza o pedido
  const { error: updateError } = await supabase
    .from('pedidos')
    .update({
      cliente_id: data.cliente_id,
      descricao: data.descricao,
      valor_total: data.valor_total
    })
    .eq('id', pedidoId)

  if (updateError) {
    console.error('Erro ao atualizar pedido:', updateError)
    throw new Error(updateError.message)
  }

  // 2. Substitui as parcelas (mais seguro para evitar inconsistências no plano de pagamento)
  // Deleta as antigas
  await supabase.from('parcelas').delete().eq('pedido_id', pedidoId)

  // Insere as novas
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error: insertError } = await supabase
    .from('parcelas')
    .insert(parcelasData.map(p => ({
      ...p,
      pedido_id: pedidoId,
      marcenaria_id: user.id,
      status: 'pendente'
    })))

  if (insertError) {
    console.error('Erro ao recriar parcelas:', insertError)
    throw new Error('Pedido atualizado, mas erro ao gerar novas parcelas.')
  }

  revalidatePath('/dashboard')
  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/financeiro')
  
  return { success: true }
}
