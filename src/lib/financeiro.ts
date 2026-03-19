import { SupabaseClient } from '@supabase/supabase-js'

export async function getFinanceiroStats(supabase: SupabaseClient, marcenariaId: string) {
  const { data: allParcelas } = await supabase
    .from('parcelas')
    .select('valor, valor_liquido, status, data_vencimento')
    .eq('marcenaria_id', marcenariaId)

  // O "Recebido" é o que já está com status 'pago'
  const totalRecebido = allParcelas
    ?.filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + Number(p.valor_liquido || p.valor), 0) || 0

  // O "A Receber" engloba todas as parcelas com status 'pendente' 
  // que pertencem à marcenaria em questão
  const totalAReceber = allParcelas
    ?.filter(p => p.status === 'pendente')
    .reduce((sum, p) => sum + Number(p.valor_liquido || p.valor), 0) || 0

  // O "Vencido" engloba parcelas pendentes com data de vencimento anterior a hoje
  const today = new Date().toISOString().split('T')[0]
  const totalVencido = allParcelas
    ?.filter(p => p.status === 'pendente' && p.data_vencimento < today)
    .reduce((sum, p) => sum + Number(p.valor_liquido || p.valor), 0) || 0

  // O "Faturamento" (Bruto) é a soma do que já foi Recebido + o que falta Receber
  const totalBruto = totalRecebido + totalAReceber

  return {
    bruto: totalBruto,
    recebido: totalRecebido,
    aReceber: totalAReceber,
    vencido: totalVencido
  }
}
