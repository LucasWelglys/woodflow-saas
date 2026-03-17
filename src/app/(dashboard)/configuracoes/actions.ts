'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateMarcenaria(formData: { nome: string, email_contato: string }) {
    const supabase = createClient()
    
    // Obtém o usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return { success: false, error: 'Usuário não autenticado' }
    }

    // Atualiza a marcenaria vinculada a este usuário (dono_id)
    const { error } = await supabase
        .from('marcenarias')
        .update({
            nome: formData.nome,
            email_contato: formData.email_contato,
            updated_at: new Date().toISOString()
        })
        .eq('dono_id', user.id)

    if (error) {
        console.error('Erro ao atualizar marcenaria:', error)
        return { success: false, error: error.message }
    }

    // Revalidação para atualizar o cache do Next.js se necessário
    revalidatePath('/dashboard/configuracoes')
    
    return { success: true }
}
