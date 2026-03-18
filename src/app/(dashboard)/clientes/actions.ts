'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createCliente(data: {
    nome: string,
    email?: string,
    telefone?: string,
    cpf?: string,
    cep?: string,
    logradouro?: string,
    numero?: string,
    bairro?: string,
    cidade?: string,
    uf?: string
}) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
    }

    // Conforme instrução do usuário: usar marcenaria_id: user.id diretamente
    const { data: cliente, error } = await supabase
        .from('clientes')
        .insert({
            marcenaria_id: user.id,
            nome: data.nome,
            email: data.email || null,
            telefone: data.telefone || null,
            cpf: data.cpf || null,
            cep: data.cep || null,
            logradouro: data.logradouro || null,
            numero: data.numero || null,
            bairro: data.bairro || null,
            cidade: data.cidade || null,
            uf: data.uf || null,
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
