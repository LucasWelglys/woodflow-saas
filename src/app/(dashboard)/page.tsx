'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { getFinanceiroStats } from '@/lib/financeiro'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { OrdersTable } from '@/components/dashboard/orders-table'
import { NewOrderForm } from '@/components/dashboard/new-order-form'
import { DashboardData, Order } from '@/types/dashboard'
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  PiggyBank,
  Activity
} from 'lucide-react'
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [data, setData] = useState<any>({
    summary: {
      bruto: 0,
      recebido: 0,
      aReceber: 0,
      vencido: 0,
      despesas: 0,
      saldoReal: 0,
      saldoProjetado: 0,
      custos: 0,
      totalEmOrcamentos: 0
    },
    orders: []
  })

  const supabase = useMemo(() => createClient(), [])

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    
    try {
      // 0. Get Marcenaria Context
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: marcenaria } = await supabase
        .from('marcenarias')
        .select('id')
        .eq('dono_id', user.id)
        .single()

      if (!marcenaria) return

      // 1. Fetch recent orders
      const { data: ordersRaw } = await supabase
        .from('pedidos')
        .select('*, clientes(nome)')
        .eq('marcenaria_id', marcenaria.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const ordersTyped = (ordersRaw as unknown as Order[] || []).map(o => ({
        ...o,
        cliente_nome: o.clientes?.nome || 'N/A'
      }))

      // 2. Fetch Aggregated Data from Views
      const { data: monthlyData } = await supabase
        .from('v_dashboard_mensal')
        .select('*')
        .eq('marcenaria_id', marcenaria.id)

      const stats = await getFinanceiroStats(supabase, marcenaria.id)
      const totalRecebido = stats.recebido
      const totalAReceber = stats.aReceber
      const totalVencido = stats.vencido
      const totalBruto = stats.bruto

      // 3. Prepare Chart Data (Fluxo Mensal)
      const monthsMap: Record<string, any> = {}
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
      })
      
      const formattedChartData = Object.values(monthsMap).slice(-6)
      
      // 4. Prepare Pie Data (Modalidades)
      const modalityMap: Record<string, number> = {}
      monthlyData?.forEach(item => {
        modalityMap[item.modalidade] = (modalityMap[item.modalidade] || 0) + Number(item.total_recebido)
      })

      const COLORS = ['#EF6C00', '#2D241E', '#8D6E63', '#5D4037', '#2E7D32']
      const formattedPieData = Object.entries(modalityMap)
        .filter(([_, value]) => value > 0)
        .map(([name, value], index) => ({
          name: name.toUpperCase(),
          value,
          fill: COLORS[index % COLORS.length]
        }))

      setChartData(formattedChartData)
      setPieData(formattedPieData)
      setData({
        summary: {
          bruto: stats.bruto,
          recebido: stats.recebido,
          aReceber: stats.aReceber,
          vencido: stats.vencido,
          despesas: stats.despesas,
          saldoReal: stats.saldoReal,
          saldoProjetado: stats.saldoProjetado,
          custos: stats.custos,
          totalEmOrcamentos: stats.totalEmOrcamentos
        },
        orders: ordersTyped
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {showNewOrder && (
        <NewOrderForm 
          onClose={() => setShowNewOrder(false)} 
          onSuccess={() => {
            setShowNewOrder(false)
            fetchDashboardData()
          }} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-wood-dark tracking-tighter">Fluxo de Caixa</h2>
          <p className="text-stone-500 mt-1 font-medium">Dados reais sincronizados com o banco WoodFlow.</p>
        </div>
        <button 
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-2 bg-alerta-laranja text-white px-6 py-4 rounded-2xl font-bold text-sm hover:shadow-xl hover:shadow-alerta-laranja/20 transition-all hover:-translate-y-1 active:scale-95 shadow-lg shadow-alerta-laranja/10"
        >
          <Plus className="h-5 w-5" />
          Novo Pedido
        </button>
      </div>

      {/* Super Card Saldo Real */}
      <div className="bg-wood-dark text-white p-8 rounded-[2rem] shadow-2xl shadow-wood-dark/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-xs font-bold uppercase tracking-widest text-wood-light flex items-center justify-center md:justify-start gap-2 mb-2">
            <PiggyBank className="h-4 w-4" /> Saldo Real Operacional
          </h3>
          <p className="text-4xl md:text-5xl font-black tracking-tight">{fmt(data.summary.saldoReal)}</p>
          <p className="text-xs font-bold text-stone-400 mt-2 opacity-80 uppercase tracking-widest">Líquido Recebido - Custos e Despesas</p>
        </div>
        <div className="relative z-10 bg-white/10 px-8 py-6 rounded-2xl flex items-center gap-3 shadow-inner self-stretch md:self-auto border border-white/5">
          <div className="text-center md:text-right w-full">
            <span className="block text-[10px] uppercase font-bold text-stone-300 tracking-widest mb-1">Saldo Projetado</span>
            <span className="block text-2xl font-black tracking-tighter text-emerald-400">{fmt(data.summary.saldoProjetado)}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        <SummaryCard 
          title="💰 FATURAMENTO" 
          value={fmt(data.summary.bruto)} 
          subtitle="Valor Bruto Total" 
          icon={TrendingUp}
          loading={loading}
        />
        <SummaryCard 
          title="✅ CAIXA REAL" 
          value={fmt(data.summary.recebido)} 
          subtitle="Faturamento recebido" 
          icon={Wallet}
          variant="success"
          loading={loading}
        />
        <SummaryCard 
          title="🏷️ EM ORÇAMENTO" 
          value={fmt(data.summary.totalEmOrcamentos)} 
          subtitle="Propostas abertas" 
          icon={TrendingUp}
          loading={loading}
        />
        <SummaryCard 
          title="⏳ A RECEBER" 
          value={fmt(data.summary.aReceber)} 
          subtitle="Parcelas pendentes" 
          icon={Clock}
          variant="warning"
          loading={loading}
        />
        <SummaryCard 
          title="📉 DESPESAS" 
          value={fmt(data.summary.despesas)} 
          subtitle="Fixas e Variáveis" 
          icon={Activity}
          variant="error"
          loading={loading}
        />
        <SummaryCard 
          title="⚠️ VENCIDO" 
          value={fmt(data.summary.vencido)} 
          subtitle="Cobranças em atraso" 
          icon={AlertCircle}
          variant="error"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
          <h3 className="text-xl font-bold text-wood-dark mb-6">Fluxo Mensal (Real vs Pendente)</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#6B7280" />
                <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#6B7280" tickFormatter={(v: number) => `R$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [fmt(value), '']}
                />
                <Legend iconType="circle" />
                <Bar name="Recebido (Caixa)" dataKey="real" fill="#2E7D32" radius={[6, 6, 0, 0]} />
                <Bar name="Pendente" dataKey="pendente" fill="#EF6C00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
          <h3 className="text-xl font-bold text-wood-dark mb-6">Saúde Financeira</h3>
          <div className="h-[350px] w-full flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                {
                  name: 'Saúde Real',
                  Entradas: data.summary.recebido,
                  Saídas: data.summary.custos + data.summary.despesas
                }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#6B7280" />
                <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#6B7280" tickFormatter={(v: number) => `R$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [fmt(value), '']}
                />
                <Legend iconType="circle" />
                <Bar name="Entradas Reais" dataKey="Entradas" fill="#2E7D32" radius={[6, 6, 0, 0]} />
                <Bar name="Saídas (Despesas + Custos)" dataKey="Saídas" fill="#D32F2F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
        <h3 className="text-xl font-bold text-wood-dark mb-6">Últimos Pedidos</h3>
        <OrdersTable orders={data.orders} loading={loading} />
      </div>
    </div>
  )
}
