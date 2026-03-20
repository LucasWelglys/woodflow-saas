'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getMarcenariaContext } from '@/lib/marcenaria'
import { DespesaGlobalSchema } from '@/schemas/financeiro.schema'
import { logAction } from '@/lib/audit'
interface DespesaInput {
  descricao: string
  valor: number
  categoria: 'fixa' | 'variavel'
  data_despesa: string
}

export async function adicionarDespesa(data: DespesaInput) {
  const supabase = createClient()
  const marcenaria = await getMarcenariaContext()
  
  if (!marcenaria) {
    throw new Error('Acesso negado')
  }

  const parsedData = DespesaGlobalSchema.parse(data)

  const { data: newDespesa, error } = await supabase
    .from('despesas')
    .insert({
      marcenaria_id: marcenaria.id,
      descricao: parsedData.descricao,
      valor: parsedData.valor,
      categoria: parsedData.categoria,
      data_despesa: parsedData.data_pagamento || new Date().toISOString().split('T')[0]
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao inserir despesa:', error)
    throw new Error('Falha ao inserir despesa')
  }

  await logAction(supabase, marcenaria.id, 'despesas', 'INSERT', newDespesa.id, parsedData)

  revalidatePath('/despesas')
  revalidatePath('/financeiro')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function removerDespesa(id: string) {
  const supabase = createClient()
  const marcenaria = await getMarcenariaContext()
  
  if (!marcenaria) {
    throw new Error('Acesso negado')
  }

  const { error } = await supabase
    .from('despesas')
    .delete()
    .eq('id', id)
    .eq('marcenaria_id', marcenaria.id)

  if (error) {
    console.error('Erro ao remover despesa:', error)
    throw new Error('Falha ao excluir despesa')
  }

  await logAction(supabase, marcenaria.id, 'despesas', 'DELETE', id, { removida: true })

  revalidatePath('/despesas')
  revalidatePath('/financeiro')
  revalidatePath('/dashboard')
  return { success: true }
}
