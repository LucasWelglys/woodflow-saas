import { SupabaseClient } from '@supabase/supabase-js'

export async function getFinanceiroStats(supabase: SupabaseClient, marcenariaId: string) {
  // 1. Busca os dados agregados da View Financeira (Performance < 800ms)
  const { data: view } = await supabase
    .from('v_dashboard_financeiro')
    .select('*')
    .eq('marcenaria_id', marcenariaId)
    .single()

  const totalBruto = Number(view?.faturamento_bruto || 0)
  const totalRecebido = Number(view?.caixa_real || 0)
  const totalAReceber = Number(view?.a_receber || 0)
  const saldoProjetadoBase = Number(view?.saldo_projetado || 0)

  // 2. Buscas auxiliares pontuais (Vencido, Orçamentos e Despesas)
  const today = new Date().toISOString().split('T')[0]
  
  // Vencidos (Pendente + Data vencida + Não é orçamento)
  const { data: vencidasData } = await supabase
    .from('parcelas')
    .select('valor, valor_liquido, pedidos!inner(status)')
    .eq('marcenaria_id', marcenariaId)
    .eq('status', 'pendente')
    .lt('data_vencimento', today)

  const totalVencido = vencidasData
    ?.filter(p => (p.pedidos as any)?.status !== 'orcamento')
    .reduce((sum, p) => sum + Number(p.valor_liquido || p.valor), 0) || 0

  // Total Orçamentos Abertos
  const { data: orcamentos } = await supabase
    .from('pedidos')
    .select('valor_total')
    .eq('marcenaria_id', marcenariaId)
    .eq('status', 'orcamento')
  const totalEmOrcamentos = orcamentos?.reduce((sum, o) => sum + Number(o.valor_total), 0) || 0

  // Total Despesas
  const { data: despesas } = await supabase
    .from('despesas')
    .select('valor')
    .eq('marcenaria_id', marcenariaId)
  const totalDespesas = despesas?.reduce((sum, d) => sum + Number(d.valor), 0) || 0

  // Total Custos (apenas para exibição e Saldo Real)
  const { data: custos } = await supabase
    .from('custos_projeto')
    .select('valor')
    .eq('marcenaria_id', marcenariaId)
  const totalCustos = custos?.reduce((sum, c) => sum + Number(c.valor), 0) || 0

  // Saldos
  const saldoReal = totalRecebido - totalCustos - totalDespesas
  const saldoProjetado = saldoProjetadoBase - totalDespesas

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
