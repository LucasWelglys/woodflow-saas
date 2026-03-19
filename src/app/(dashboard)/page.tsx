'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { OrdersTable } from '@/components/dashboard/orders-table'
import { NewOrderForm } from '@/components/dashboard/new-order-form'
import { DashboardData, Order } from '@/types/dashboard'
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  Clock, 
  AlertCircle 
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
  const [data, setData] = useState<DashboardData>({
    summary: {
      bruto: 0,
      recebido: 0,
      aReceber: 0,
      vencido: 0
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

      const summaryTotals = monthlyData?.reduce((acc, curr) => ({
        recebido: acc.recebido + Number(curr.total_recebido),
        aReceber: acc.aReceber + Number(curr.total_a_receber),
        vencido: acc.vencido + Number(curr.total_vencido)
      }), { recebido: 0, aReceber: 0, vencido: 0 }) || { recebido: 0, aReceber: 0, vencido: 0 }

      const totalBruto = summaryTotals.recebido + summaryTotals.aReceber

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
          bruto: totalBruto,
          recebido: summaryTotals.recebido,
          aReceber: summaryTotals.aReceber,
          vencido: summaryTotals.vencido
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="💰 FATURAMENTO" 
          value={fmt(data.summary.bruto)} 
          subtitle="Valor Líquido Projetado" 
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
          title="⏳ A RECEBER" 
          value={fmt(data.summary.aReceber)} 
          subtitle="Parcelas pendentes" 
          icon={Clock}
          variant="warning"
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
        {/* Flux Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
          <h3 className="text-xl font-bold text-wood-dark mb-6">Fluxo Mensal (Real vs Pendente)</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="#6B7280" />
                <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#6B7280" tickFormatter={(v) => `R$${v/1000}k`} />
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

        {/* Modalidade Chart */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100">
          <h3 className="text-xl font-bold text-wood-dark mb-6">Recebido por Modalidade</h3>
          <div className="h-[350px] w-full flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
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
