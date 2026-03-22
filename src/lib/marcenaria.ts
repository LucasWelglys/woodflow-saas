import { createClient } from './supabase-server'

export async function getMarcenariaContext() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // 1. Verificação de Bypass para Super Admin
    // Checamos metadados do auth ou buscamos o perfil
    const userRole = user.app_metadata?.role || user.user_metadata?.role

// Se for Super Admin, tentamos pegar a marcenaria dele (dono_id) ou tenant_id
    if (userRole === 'super-admin') {
        const { data: adminMarcenaria } = await supabase
            .from('marcenarias')
            .select('*')
            .eq('dono_id', user.id)
            .maybeSingle()
        
        if (adminMarcenaria) return adminMarcenaria
    }

    // 2. Buscamos o perfil para usuários comuns
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .maybeSingle()

    // Se o perfil indicar super-admin (backup do check anterior)
    if (profile?.role === 'super-admin') {
        const { data: adminMarcenaria } = await supabase
            .from('marcenarias')
            .select('*')
            .eq('dono_id', user.id)
            .maybeSingle()
        
        if (adminMarcenaria) return adminMarcenaria
    }

    // 3. Lógica para Membros (tenant_id)
    if (profile?.tenant_id) {
        const { data: marcenaria, error: marcError } = await supabase
            .from('marcenarias')
            .select('*')
            .eq('id', profile.tenant_id)
            .maybeSingle()

        if (marcenaria) return marcenaria
    }

    // 4. Fallback Final: Tenta buscar onde ele é o dono (comportamento para proprietários)
    const { data: ownedMarcenaria, error: fallbackError } = await supabase
        .from('marcenarias')
        .select('*')
        .eq('dono_id', user.id)
        .maybeSingle()

    if (fallbackError) {
        console.error('Erro crítico no fallback de marcenaria:', fallbackError)
    }
            
    return ownedMarcenaria || null
}
