'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { getFinanceiroStats } from '@/lib/financeiro'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { PaymentButton } from '@/components/financeiro/payment-button'
import { recalculateFinanceiro } from '@/app/actions/financeiro'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts'

interface ParcelaDetalhe {
    id: string
    numero_parcela: number
    valor: number
    valor_liquido?: number
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
  const [recalculating, setRecalculating] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // 0. Get Marcenaria Context
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: marcenaria } = await supabase
        .from('marcenarias')
        .select('id')
        .eq('dono_id', user.id)
        .single()

    if (!marcenaria) return

    // 1. Fetch Metrics
    const stats = await getFinanceiroStats(supabase, marcenaria.id)

    setMetrics({
      bruto: stats.bruto,
      recebido: stats.recebido,
      aReceber: stats.aReceber,
      vencido: stats.vencido
    })

    // 2. Fetch "Vencendo Hoje" (status pendente, vencimento hoje)
    const { data: hojeData } = await supabase
        .from('parcelas')
        .select('*, pedidos(descricao, clientes(nome))')
        .eq('marcenaria_id', marcenaria.id)
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
        .eq('marcenaria_id', marcenaria.id)
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

  const [chartData, setChartData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])

  useEffect(() => {
    const loadCharts = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: marcenaria } = await supabase
            .from('marcenarias')
            .select('id')
            .eq('dono_id', user.id)
            .single()

        if (!marcenaria) return

        const { data: monthlyData } = await supabase
            .from('v_dashboard_mensal')
            .select('*')
            .eq('marcenaria_id', marcenaria.id)
        
        const monthsMap: Record<string, any> = {}
        const modalityMap: Record<string, number> = {}
        const COLORS = ['#EF6C00', '#2D241E', '#8D6E63', '#5D4037', '#2E7D32']

        monthlyData?.forEach(item => {
            const key = `${item.ano}-${item.mes}`
            if (!monthsMap[key]) {
                monthsMap[key] = { 
                    name: new Date(item.ano, item.mes - 1).toLocaleString('pt-BR', { month: 'short' }),
                    real: 0,
                    pendente: 0 
                }
            }
            monthsMap[key].real += Number(item.total_recebido)
            monthsMap[key].pendente += Number(item.total_a_receber)
            modalityMap[item.modalidade] = (modalityMap[item.modalidade] || 0) + Number(item.total_recebido)
        })

        setChartData(Object.values(monthsMap).slice(-6))
        setPieData(Object.entries(modalityMap)
            .filter(([_, v]) => v > 0)
            .map(([name, value], i) => ({ name: name.toUpperCase(), value, fill: COLORS[i % COLORS.length] })))
    }
    loadCharts()
  }, [supabase])

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-wood-dark tracking-tight">Gestão Financeira</h2>
          <p className="text-stone-500 mt-1 font-medium">Análise detalhada de recebimentos e fluxo de caixa.</p>
        </div>
        <button 
          onClick={async () => {
            setRecalculating(true)
            try {
              const result = await recalculateFinanceiro()
              fetchData()
              if (result.count && result.count > 0) {
                alert(`Sucesso! ${result.count} parcelas foram recalculadas.`)
              } else {
                alert(result.message || 'Nenhuma parcela precisava de recálculo.')
              }
            } catch (error) {
              alert('Erro ao recalcular taxas')
            } finally {
              setRecalculating(false)
            }
          }}
          disabled={recalculating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-600 font-bold text-sm hover:bg-stone-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          title="Recalcular taxas para todos os pedidos"
        >
          <RefreshCw className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Recalculando...' : 'Recalcular Financeiro'}
        </button>
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
                                        <span className="text-sm font-black text-wood-dark">{fmt(p.valor_liquido || p.valor)}</span>
                                        <div className="text-[10px] text-stone-400 font-bold uppercase">{p.modalidade}</div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <PaymentButton parcelaId={p.id} onSuccess={fetchData} />
                                            <Link href={`/pedidos/${p.pedido_id}`} className="inline-flex p-2 hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-all text-stone-300 hover:text-wood-dark">
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </div>
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
                <span className="text-xs font-bold text-stone-400">TOTAL: {fmt(aReceber.reduce((acc, curr) => acc + Number(curr.valor_liquido || curr.valor), 0))}</span>
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
                                        <span className="text-sm font-black text-wood-dark">{fmt(p.valor_liquido || p.valor)}</span>
                                        <div className="text-[10px] text-stone-400 font-bold uppercase">{p.modalidade}</div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <PaymentButton parcelaId={p.id} onSuccess={fetchData} />
                                            <Link href={`/pedidos/${p.pedido_id}`} className="inline-flex p-2 hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-all text-stone-300 hover:text-wood-dark">
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm min-h-[350px]">
          <h3 className="text-xl font-bold text-wood-dark mb-6">Fluxo Mensal (Real vs Pendente)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#6B7280" />
                <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#6B7280" />
                <Tooltip />
                <Bar name="Recebido" dataKey="real" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                <Bar name="Pendente" dataKey="pendente" fill="#EF6C00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm min-h-[350px]">
          <h3 className="text-xl font-bold text-wood-dark mb-6">Recebido por Modalidade</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
