import { SupabaseClient } from '@supabase/supabase-js'

export async function logAction(
  supabase: SupabaseClient,
  marcenariaId: string,
  tabelaAfetada: string,
  acao: 'INSERT' | 'UPDATE' | 'DELETE',
  registroId: string,
  detalhes: any = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('audit_logs').insert({
      marcenaria_id: marcenariaId,
      user_id: user?.id || null,
      tabela_afetada: tabelaAfetada,
      acao,
      registro_id: registroId,
      detalhes
    })
    
    if (error) {
      console.error('[AUDIT ERROR]', error)
      // Em sistemas criticos re-lancariamos o erro, 
      // mas vamos prevenir crash de fluxo principal.
    }
  } catch (err) {
    console.error('[AUDIT EXCEPTION]', err)
  }
}
