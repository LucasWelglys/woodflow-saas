'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface ParcelaDetalhe {
    id: string
    numero_parcela: number
    valor: number
    data_vencimento: string
    modalidade: string
    status: string
    pedido_id: string
    pedidos: {
        cliente_id: string
        descricao: string
        clientes: {
            nome: string
        }
    }
}

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    bruto: 0,
    recebido: 0,
    aReceber: 0,
    vencido: 0
  })
  const [vencendoHoje, setVencendoHoje] = useState<ParcelaDetalhe[]>([])
  const [aReceber, setAReceber] = useState<ParcelaDetalhe[]>([])

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // 1. Fetch Metrics (already correct but ensuring efficiency)
    const { data: pedidos } = await supabase.from('pedidos').select('valor_total')
    const totalBruto = pedidos?.reduce((acc, curr) => acc + curr.valor_total, 0) || 0

    const { data: pagos } = await supabase.from('parcelas').select('valor').eq('status', 'pago')
    const totalRecebido = pagos?.reduce((acc, curr) => acc + curr.valor, 0) || 0

    const { data: pendentes } = await supabase.from('parcelas').select('valor').eq('status', 'pendente')
    const totalAReceber = pendentes?.reduce((acc, curr) => acc + curr.valor, 0) || 0

    const { data: vencidos } = await supabase.from('v_boletos_vencidos').select('valor')
    const totalVencido = vencidos?.reduce((acc, curr) => acc + curr.valor, 0) || 0

    setMetrics({
      bruto: totalBruto,
      recebido: totalRecebido,
      aReceber: totalAReceber,
      vencido: totalVencido
    })

    // 2. Fetch "Vencendo Hoje" (status pendente, vencimento hoje)
    const { data: hojeData } = await supabase
        .from('parcelas')
        .select('*, pedidos(descricao, clientes(nome))')
        .eq('status', 'pendente')
        .eq('data_vencimento', today)
        .order('valor', { ascending: false })

    if (hojeData) setVencendoHoje(hojeData as unknown as ParcelaDetalhe[])

    // 3. Fetch "A Receber" (próximos 30 dias, status pendente)
    const next30Days = new Date()
    next30Days.setDate(next30Days.getDate() + 30)
    const next30Str = next30Days.toISOString().split('T')[0]

    const { data: aReceberData } = await supabase
        .from('parcelas')
        .select('*, pedidos(descricao, clientes(nome))')
        .eq('status', 'pendente')
        .gt('data_vencimento', today)
        .lte('data_vencimento', next30Str)
        .order('data_vencimento', { ascending: true })

    if (aReceberData) setAReceber(aReceberData as unknown as ParcelaDetalhe[])

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div>
        <h2 className="text-3xl font-extrabold text-wood-dark tracking-tight">Gestão Financeira</h2>
        <p className="text-stone-500 mt-1 font-medium">Análise detalhada de recebimentos e fluxo de caixa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="💰 FATURAMENTO BRUTO" 
          value={fmt(metrics.bruto)} 
          subtitle="Total em contratos" 
          icon={TrendingUp}
          loading={loading}
        />
        <SummaryCard 
          title="✅ CAIXA REAL" 
          value={fmt(metrics.recebido)} 
          subtitle="Faturamento recebido" 
          icon={Wallet}
          variant="success"
          loading={loading}
        />
        <SummaryCard 
          title="⏳ A RECEBER" 
          value={fmt(metrics.aReceber)} 
          subtitle="Próximos 30 dias" 
          icon={Clock}
          variant="warning"
          loading={loading}
        />
        <SummaryCard 
          title="⚠️ VENCIDO" 
          value={fmt(metrics.vencido)} 
          subtitle="Cobranças em atraso" 
          icon={AlertCircle}
          variant="error"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seção: Vencendo Hoje */}
        <section className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-stone-100 bg-emerald-50/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-wood-dark">Vencendo Hoje</h3>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">{vencendoHoje.length} PARCELAS</span>
            </div>
            <div className="p-0">
                <table className="w-full text-left">
                    <tbody className="divide-y divide-stone-50">
                        {vencendoHoje.length === 0 ? (
                            <tr><td className="px-8 py-10 text-center text-stone-400 text-sm font-medium">Nenhuma parcela vencendo hoje.</td></tr>
                        ) : (
                            vencendoHoje.map((p) => (
                                <tr key={p.id} className="group hover:bg-stone-50/50 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-wood-dark">{p.pedidos.clientes.nome}</span>
                                            <span className="text-[10px] text-stone-400 uppercase font-bold">{p.pedidos.descricao}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="text-sm font-black text-wood-dark">{fmt(p.valor)}</span>
                                        <div className="text-[10px] text-stone-400 font-bold uppercase">{p.modalidade}</div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <Link href={`/dashboard/pedidos/${p.pedido_id}`} className="inline-flex p-2 hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-all text-stone-300 hover:text-wood-dark">
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>

        {/* Seção: Próximos Recebimentos */}
        <section className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-wood-dark">Próximos 30 Dias</h3>
                </div>
                <span className="text-xs font-bold text-stone-400">TOTAL: {fmt(aReceber.reduce((acc, curr) => acc + curr.valor, 0))}</span>
            </div>
            <div className="p-0">
                <table className="w-full text-left">
                    <tbody className="divide-y divide-stone-50">
                        {aReceber.length === 0 ? (
                            <tr><td className="px-8 py-10 text-center text-stone-400 text-sm font-medium">Sem recebimentos previstos para os próximos 30 dias.</td></tr>
                        ) : (
                            aReceber.map((p) => (
                                <tr key={p.id} className="group hover:bg-stone-50/50 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-wood-dark">{p.pedidos.clientes.nome}</span>
                                            <span className="text-[10px] text-stone-400 font-bold">{new Date(p.data_vencimento).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="text-sm font-black text-wood-dark">{fmt(p.valor)}</span>
                                        <div className="text-[10px] text-stone-400 font-bold uppercase">{p.modalidade}</div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <Link href={`/dashboard/pedidos/${p.pedido_id}`} className="inline-flex p-2 hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-all text-stone-300 hover:text-wood-dark">
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-50">
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center justify-center space-y-4 min-h-[200px]">
          <BarChart3 className="h-8 w-8 text-stone-200" />
          <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Fluxo Mensal (Fase 3.2)</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center justify-center space-y-4 min-h-[200px]">
          <PieChartIcon className="h-8 w-8 text-stone-200" />
          <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Modalidades (Fase 3.2)</p>
        </div>
      </div>
    </div>
  )
}
