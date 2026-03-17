'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateMarcenaria(formData: {
    nome: string,
    email_contato: string,
    notificacoes_pedidos: boolean // Adicionamos aqui
}) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
    }

    const { error } = await supabase
        .from('marcenarias')
        .upsert({
            dono_id: user.id,
            nome: formData.nome,
            email_contato: formData.email_contato,
            notificacoes_pedidos: formData.notificacoes_pedidos, // E aqui
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'dono_id'
        })

    if (error) {
        console.error('Erro no Supabase:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/configuracoes')
    return { success: true }
}