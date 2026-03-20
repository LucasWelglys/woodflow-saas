import { SupabaseClient } from '@supabase/supabase-js'

export async function getFinanceiroStats(supabase: SupabaseClient, marcenariaId: string) {
  const { data: allParcelas } = await supabase
    .from('parcelas')
    .select('valor, valor_liquido, status, data_vencimento, pedidos!inner(status)')
    .eq('marcenaria_id', marcenariaId)

  // O "Recebido" é o que já está com status 'pago' (ignora se é orçamento ou não, dinheiro já entrou)
  const totalRecebido = allParcelas
    ?.filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + Number(p.valor_liquido || p.valor), 0) || 0

  // O "A Receber" engloba parcelas pendentes de pedidos concretos (não orçamentos)
  const totalAReceber = allParcelas
    ?.filter(p => p.status === 'pendente' && (p.pedidos as any)?.status !== 'orcamento')
    .reduce((sum, p) => sum + Number(p.valor_liquido || p.valor), 0) || 0

  // O "Vencido" engloba pendentes atrasados (não orçamentos)
  const today = new Date().toISOString().split('T')[0]
  const totalVencido = allParcelas
    ?.filter(p => p.status === 'pendente' && p.data_vencimento < today && (p.pedidos as any)?.status !== 'orcamento')
    .reduce((sum, p) => sum + Number(p.valor_liquido || p.valor), 0) || 0

  // O "Faturamento" (Bruto) é a soma do que já foi Recebido + o que falta Receber (apenas contratos)
  const totalBruto = totalRecebido + totalAReceber

  // Busca Total em Orçamentos
  const { data: orcamentos } = await supabase
    .from('pedidos')
    .select('valor_total')
    .eq('marcenaria_id', marcenariaId)
    .eq('status', 'orcamento')
  
  const totalEmOrcamentos = orcamentos?.reduce((sum, o) => sum + Number(o.valor_total), 0) || 0

  // Busca Custos de Projetos
  const { data: custos } = await supabase
    .from('custos_projeto')
    .select('valor')
    .eq('marcenaria_id', marcenariaId)
  const totalCustos = custos?.reduce((sum, c) => sum + Number(c.valor), 0) || 0

  // Busca Despesas
  const { data: despesas } = await supabase
    .from('despesas')
    .select('valor')
    .eq('marcenaria_id', marcenariaId)
  const totalDespesas = despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0

  // Saldos
  const saldoReal = totalRecebido - totalCustos - totalDespesas
  const saldoProjetado = totalBruto - totalCustos - totalDespesas

  return {
    bruto: totalBruto,
    recebido: totalRecebido,
    aReceber: totalAReceber,
    vencido: totalVencido,
    custos: totalCustos,
    despesas: totalDespesas,
    saldoReal,
    saldoProjetado,
    totalEmOrcamentos
  }
}
