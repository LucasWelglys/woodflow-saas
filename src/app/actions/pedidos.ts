'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getMarcenariaContext } from '@/lib/marcenaria'
import { UpdatePedidoSchema, ParcelaSchema } from '@/schemas/pedidos.schema'
import { logAction } from '@/lib/audit'
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

  const marcenaria = await getMarcenariaContext()
  if (marcenaria) {
    await logAction(supabase, marcenaria.id, 'pedidos', 'UPDATE', pedidoId, { acao: 'converter_para_contrato' })
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
    throw new Error('Erro ao validar situação financeira do pedido: ' + checkError.message)
  }

  if (paidParcelas && paidParcelas.length > 0) {
    throw new Error('Não é possível excluir: este pedido já possui pagamentos registrados no financeiro.')
  }

  // Chamar RPC para deletar o pedido e suas dependências (parcelas e custos) em uma transação no banco
  const { error: rpcError } = await supabase.rpc('delete_pedido_v2', {
    pedido_id_param: pedidoId
  })

  if (rpcError) {
    console.error('Erro ao deletar pedido via RPC:', rpcError)
    // Retornamos o erro exato do Supabase/Postgres conforme solicitado
    throw new Error(`Falha na exclusão: ${rpcError.message} (${rpcError.code})`)
  }

  const marcenaria = await getMarcenariaContext()
  if (marcenaria) {
    await logAction(supabase, marcenaria.id, 'pedidos', 'DELETE', pedidoId, { removido: true })
  }

  revalidatePath('/dashboard')
  revalidatePath('/pedidos')
  revalidatePath('/financeiro')
  
  return { success: true }
}

export async function updatePedido(pedidoId: string, data: any, parcelasData: any[]) {
  const supabase = createClient()
  
  const parsedData = UpdatePedidoSchema.parse(data)
  const parsedParcelas = ParcelaSchema.array().parse(parcelasData)

  // 1. Atualiza o pedido
  const { error: updateError } = await supabase
    .from('pedidos')
    .update({
      cliente_id: parsedData.cliente_id,
      descricao: parsedData.descricao,
      valor_total: parsedData.valor_total
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
  const marcenaria = await getMarcenariaContext()
  if (!marcenaria) throw new Error('Marcenaria não encontrada ou usuário não autenticado')

  const { error: insertError } = await supabase
    .from('parcelas')
    .insert(parsedParcelas.map(p => ({
      ...p,
      pedido_id: pedidoId,
      marcenaria_id: marcenaria.id,
      status: p.status || 'pendente'
    })))

  if (insertError) {
    console.error('Erro ao recriar parcelas:', insertError)
    throw new Error('Pedido atualizado, mas erro ao gerar novas parcelas.')
  }

  await logAction(supabase, marcenaria.id, 'pedidos', 'UPDATE', pedidoId, { acao: 'update_pedido_e_parcelas', dados: parsedData })

  revalidatePath('/dashboard')
  revalidatePath('/pedidos')
  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/financeiro')
  
  return { success: true }
}
