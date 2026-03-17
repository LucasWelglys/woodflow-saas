'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateMarcenaria(formData: { nome: string, email_contato: string }) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
    }

    // O UPSERT cria o registro se ele não existir ou atualiza se já existir
    const { error } = await supabase
        .from('marcenarias')
        .upsert({
            dono_id: user.id, // Chave para identificar o dono
            nome: formData.nome,
            email_contato: formData.email_contato,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'dono_id' // Se o dono_id já existir, ele apenas atualiza
        })

    if (error) {
        console.error('Erro no Supabase:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/configuracoes')
    return { success: true }
}