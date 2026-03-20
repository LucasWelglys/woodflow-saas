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

    console.log(`[AUDIT LOG REQUEST] Acao: ${acao} | Tabela: ${tabelaAfetada} | RegistroId: ${registroId} | MarcenariaId: ${marcenariaId} | UserID: ${user?.id}`)

    const { error } = await supabase.from('audit_logs').insert({
      marcenaria_id: marcenariaId,
      user_id: user?.id || null,
      tabela_afetada: tabelaAfetada,
      acao,
      registro_id: registroId,
      detalhes
    })
    
    if (error) {
      console.error('[AUDIT ERROR] Falha ao inserir log de auditoria no Supabase:', JSON.stringify(error))
    } else {
      console.log(`[AUDIT SUCESSO] Log de auditoria criado para a acao ${acao} (Registro ${registroId})`)
    }
  } catch (err) {
    console.error('[AUDIT EXCEPTION] Erro critico ao tentar escrever auditoria:', err)
  }
}

