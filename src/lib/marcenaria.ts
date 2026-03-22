import { createClient } from './supabase-server'

export async function getMarcenariaContext() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // 1. Buscamos o perfil para obter o tenant_id
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (profileError || !profile?.tenant_id) {
        console.error('Erro ao buscar perfil ou tenant_id:', profileError)
        
        // Fallback: Tenta buscar onde ele é o dono (comportamento original)
        const { data: ownedMarcenaria } = await supabase
            .from('marcenarias')
            .select('*')
            .eq('dono_id', user.id)
            .maybeSingle()
            
        return ownedMarcenaria || null
    }

    // 2. Buscamos a marcenaria vinculada ao tenant_id
    const { data: marcenaria, error: marcError } = await supabase
        .from('marcenarias')
        .select('*')
        .eq('id', profile.tenant_id)
        .single()

    if (marcError) {
        console.error('Erro ao buscar contexto da marcenaria por tenant_id:', marcError)
        return null
    }

    return marcenaria
}
