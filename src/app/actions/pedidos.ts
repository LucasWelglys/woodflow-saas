'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getMarcenariaContext } from '@/lib/marcenaria'
import { UpdatePedidoSchema, ParcelaSchema, CreatePedidoSchema, PedidoParcelasInputSchema } from '@/schemas/pedidos.schema'
import { logAction } from '@/lib/audit'

export async function createPedido(data: any, parcelasData: any[]) {
  const supabase = createClient()
  const pedidoId = crypto.randomUUID()
  let marcenariaId = ''

  try {
    const marcenaria = await getMarcenariaContext()
    if (!marcenaria) {
      console.error('[ACTIONS/PEDIDOS] Marcenaria não encontrada. getMarcenariaContext falhou.')
      return { success: false, error: 'Sessão inválida. Por favor, refaça o login e tente novamente.' }
    }
    marcenariaId = marcenaria.id

    // Executamos a validação de soma de centavos combinada (T3.6 precisão matemática)
    const parsedInput = PedidoParcelasInputSchema.parse({
      pedidoId,
      data,
      parcelasData
    })

    const parsedData = parsedInput.data
    const parsedParcelas = parsedInput.parcelasData

    // 1. Cria o pedido
    const { error: orderErr } = await supabase
      .from('pedidos')
      .insert({
        id: pedidoId,
        marcenaria_id: marcenaria.id,
        cliente_id: parsedData.cliente_id,
        descricao: parsedData.descricao,
        valor_total: parsedData.valor_total,
        status: 'orcamento'
      })

    if (orderErr) {
      throw new Error(`Falha no banco de dados ao criar pedido: ${orderErr.message}`)
    }

    // 2. Insere parcelas
    const { error: insertError } = await supabase
      .from('parcelas')
      .insert(parsedParcelas.map(p => ({
        ...p,
        pedido_id: pedidoId,
        marcenaria_id: marcenaria.id,
        status: p.status || 'pendente'
      })))

    if (insertError) {
      throw new Error(`Pedido criado, mas erro ao gerar parcelas: ${insertError.message}`)
    }

    console.log(`[ACTIONS/PEDIDOS] Enviando audit log para criação do pedido ${pedidoId}`)
    await logAction(supabase, marcenaria.id, 'pedidos', 'INSERT', pedidoId, { 
      acao: 'criacao_pedido', 
      cliente_id: parsedData.cliente_id,
      valor_total: parsedData.valor_total,
      parcelas_geradas: parsedParcelas.length 
    })

    revalidatePath('/dashboard')
    revalidatePath('/pedidos')
    revalidatePath('/financeiro')
    
    return { success: true, orderId: pedidoId }
  } catch (err: any) {
    console.error('[SERVER EXCEPTION] createPedido:', err)
    
    let errorMessage = err.message || 'Erro crítico no processamento da Server Action.'
    // Se for erro de validação do Zod, extraímos a mensagem clara do UX:
    if (err.issues) {
      errorMessage = err.issues.map((i: any) => i.message).join(' | ')
    }

    if (marcenariaId) {
      console.log(`[ACTIONS/PEDIDOS] Gravando log inteligente de falha no pedido ${pedidoId}`)
      await logAction(supabase, marcenariaId, 'pedidos', 'INSERT', pedidoId, {
        acao: 'erro_criacao_pedido',
        motivo: errorMessage,
        payload: { data, parcelasData }
      })
    }

    return { success: false, error: errorMessage }
  }
}

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
  try {
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
      console.error('[ACTIONS/PEDIDOS] Erro ao atualizar pedido:', updateError)
      return { success: false, error: `Falha no banco: ${updateError.message}` }
    }

    // 2. Substitui as parcelas
    await supabase.from('parcelas').delete().eq('pedido_id', pedidoId)

    const marcenaria = await getMarcenariaContext()
    if (!marcenaria) return { success: false, error: 'Usuário não autenticado.' }

    const { error: insertError } = await supabase
      .from('parcelas')
      .insert(parsedParcelas.map(p => ({
        ...p,
        pedido_id: pedidoId,
        marcenaria_id: marcenaria.id,
        status: p.status || 'pendente'
      })))

    if (insertError) {
      console.error('[ACTIONS/PEDIDOS] Erro ao recriar parcelas:', insertError)
      return { success: false, error: `Parcelas falharam: ${insertError.message}` }
    }

    await logAction(supabase, marcenaria.id, 'pedidos', 'UPDATE', pedidoId, { acao: 'update_pedido_e_parcelas', dados: parsedData })

    revalidatePath('/dashboard')
    revalidatePath('/pedidos')
    revalidatePath(`/pedidos/${pedidoId}`)
    revalidatePath('/financeiro')
    
    return { success: true }
  } catch (err: any) {
    console.error('[SERVER EXCEPTION] updatePedido:', err)
    return { success: false, error: err.message || 'Erro crítico ao atualizar pedido.' }
  }
}
