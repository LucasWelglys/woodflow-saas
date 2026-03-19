import { createClient } from './supabase-server'

export async function getMarcenariaContext() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // Buscamos a marcenaria onde o dono_id é o ID do usuário logado
    const { data: marcenaria, error } = await supabase
        .from('marcenarias')
        .select('*')
        .eq('dono_id', user.id)
        .maybeSingle()

    if (error || !marcenaria) {
        console.error('Erro ao buscar contexto da marcenaria:', error)
        return null
    }

    return marcenaria
}
