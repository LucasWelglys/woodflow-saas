'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createCliente(data: {
    nome: string,
    email?: string,
    telefone?: string
}) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
    }

    // Primeiro, pegamos o ID da marcenaria vinculada ao usuário
    const { data: marcenaria, error: marcError } = await supabase
        .from('marcenarias')
        .select('id')
        .eq('dono_id', user.id)
        .single()

    if (marcError || !marcenaria) {
        return { success: false, error: 'Marcenaria não encontrada para este usuário' }
    }

    const { data: cliente, error } = await supabase
        .from('clientes')
        .insert({
            marcenaria_id: marcenaria.id,
            nome: data.nome,
            email: data.email || null,
            telefone: data.telefone || null,
        })
        .select()
        .single()

    if (error) {
        console.error('Erro ao criar cliente:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/clientes')
    return { success: true, data: cliente }
}
