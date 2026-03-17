'use client'

import { useState, useEffect, useCallback } from 'react'
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [data, setData] = useState<DashboardData>({
    summary: {
      bruto: 0,
      recebido: 0,
      aReceber: 0,
      vencido: 0
    },
    orders: []
  })

  const supabase = createClient()

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    
    // Fetch orders with client names
    const { data: ordersRaw } = await supabase
      .from('pedidos')
      .select('*, clientes(nome)')
      .order('created_at', { ascending: false })
      .limit(5)

    const ordersTyped = (ordersRaw as unknown as Order[] || []).map(o => ({
      ...o,
      cliente_nome: o.clientes?.nome || 'N/A'
    }))

    // Fetch financial metrics from the views
    const { data: metrics } = await supabase.from('pedidos').select('valor_total')
    const totalBruto = metrics?.reduce((acc, curr) => acc + curr.valor_total, 0) || 0

    const { data: pagos } = await supabase.from('parcelas').select('valor').eq('status', 'pago')
    const totalRecebido = pagos?.reduce((acc, curr) => acc + curr.valor, 0) || 0

    const { data: pendentes } = await supabase.from('parcelas').select('valor').eq('status', 'pendente')
    const totalAReceber = pendentes?.reduce((acc, curr) => acc + curr.valor, 0) || 0

    // Fetch vencidos from the view
    const { data: vencidos } = await supabase.from('v_boletos_vencidos').select('valor')
    const totalVencido = vencidos?.reduce((acc, curr) => acc + curr.valor, 0) || 0

    setData({
      summary: {
        bruto: totalBruto,
        recebido: totalRecebido,
        aReceber: totalAReceber,
        vencido: totalVencido
      },
      orders: ordersTyped
    })
    
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {showNewOrder && (
        <NewOrderForm 
          onClose={() => setShowNewOrder(false)} 
          onSuccess={() => {
            setShowNewOrder(false)
            fetchDashboardData()
          }} 
        />
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-wood-dark tracking-tight">Painel de Gestão</h2>
          <p className="text-stone-500 mt-1 font-medium">Controle seu caixa e produção em tempo real.</p>
        </div>
        <button 
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-2 bg-wood-dark text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg hover:shadow-black/10 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Novo Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="💰 FATURAMENTO BRUTO" 
          value={fmt(data.summary.bruto)} 
          subtitle="Total em contratos" 
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

      <div className="grid grid-cols-1 gap-8">
        <OrdersTable orders={data.orders} loading={loading} />
      </div>
    </div>
  )
}
