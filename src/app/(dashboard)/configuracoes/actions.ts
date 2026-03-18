'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateMarcenaria(formData: {
    nome: string,
    email_contato: string,
    notificacoes_pedidos: boolean
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
            notificacoes_pedidos: formData.notificacoes_pedidos,
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

export async function getFinanceSettings() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Usuário não autenticado' }

    // Primeiro pegamos a marcenaria do usuário
    const { data: marcenaria } = await supabase
        .from('marcenarias')
        .select('id')
        .eq('dono_id', user.id)
        .single()

    if (!marcenaria) return { success: false, error: 'Marcenaria não encontrada' }

    const { data, error } = await supabase
        .from('configuracoes_financeiras')
        .select('*')
        .eq('marcenaria_id', marcenaria.id)
        .maybeSingle()

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, data: data || null, marcenariaId: marcenaria.id }
}

export async function updateFinanceSettings(marcenariaId: string, settings: any) {
    const supabase = createClient()
    
    const { error } = await supabase
        .from('configuracoes_financeiras')
        .upsert({
            marcenaria_id: marcenariaId,
            ...settings,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'marcenaria_id'
        })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/configuracoes')
    return { success: true }
}