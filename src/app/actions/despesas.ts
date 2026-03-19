'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getMarcenariaContext } from '@/lib/marcenaria'

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

  const { error } = await supabase
    .from('despesas')
    .insert({
      marcenaria_id: marcenaria.id,
      descricao: data.descricao,
      valor: data.valor,
      categoria: data.categoria,
      data_despesa: data.data_despesa || new Date().toISOString().split('T')[0]
    })

  if (error) {
    console.error('Erro ao inserir despesa:', error)
    throw new Error('Falha ao inserir despesa')
  }

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

  revalidatePath('/despesas')
  revalidatePath('/financeiro')
  revalidatePath('/dashboard')
  return { success: true }
}
