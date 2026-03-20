'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getMarcenariaContext } from '@/lib/marcenaria'
import { CustoProjetoSchema } from '@/schemas/financeiro.schema'
import { logAction } from '@/lib/audit'
interface CustoInput {
  pedido_id: string
  categoria: string
  descricao: string
  valor: number
}

export async function adicionarGasto(data: CustoInput) {
  const supabase = createClient()
  const marcenaria = await getMarcenariaContext()
  
  if (!marcenaria) {
    throw new Error('Acesso negado')
  }

    const parsedData = CustoProjetoSchema.parse(data)

    const { data: newCusto, error } = await supabase
      .from('custos_projeto')
      .insert({
        pedido_id: parsedData.pedido_id,
        marcenaria_id: marcenaria.id,
        categoria: parsedData.categoria,
        descricao: parsedData.descricao,
        valor: parsedData.valor,
        data_custo: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

  if (error) {
    console.error('Erro ao inserir gasto:', error)
    throw new Error('Falha ao inserir custo de projeto')
  }

  await logAction(supabase, marcenaria.id, 'custos_projeto', 'INSERT', newCusto.id, parsedData)

  revalidatePath(`/pedidos/${data.pedido_id}`)
  return { success: true }
}

export async function removerGasto(custoId: string) {
  const supabase = createClient()
  const marcenaria = await getMarcenariaContext()
  
  if (!marcenaria) {
    throw new Error('Acesso negado')
  }

  const { error } = await supabase
    .from('custos_projeto')
    .delete()
    .eq('id', custoId)
    .eq('marcenaria_id', marcenaria.id)

  if (error) {
    console.error('Erro ao remover gasto:', error)
    throw new Error('Falha ao excluir custo')
  }

  await logAction(supabase, marcenaria.id, 'custos_projeto', 'DELETE', custoId, { removido: true })

  // Revalidar de forma abrangente ou retornar flag para fetch
  return { success: true }
}
