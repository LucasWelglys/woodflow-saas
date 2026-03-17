'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { 
  TrendingUp, 
  Wallet, 
  Clock, 
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    bruto: 0,
    recebido: 0,
    aReceber: 0,
    vencido: 0
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true)
      
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
      setLoading(false)
    }
    fetchMetrics()
  }, [supabase])

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-wood-dark tracking-tight">Gestão Financeira</h2>
        <p className="text-stone-500 mt-1 font-medium">Análise profunda do seu faturamento e saúde do caixa.</p>
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
          subtitle="Parcelas pendentes" 
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          <BarChart3 className="h-12 w-12 text-stone-200" />
          <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Fluxo Mensal (Em breve)</p>
          <div className="w-full space-y-2">
            <div className="h-4 bg-stone-50 rounded-full w-full" />
            <div className="h-4 bg-stone-50 rounded-full w-3/4" />
            <div className="h-4 bg-stone-50 rounded-full w-1/2" />
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          <PieChartIcon className="h-12 w-12 text-stone-200" />
          <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Modalidades (Em breve)</p>
          <div className="h-32 w-32 rounded-full border-8 border-stone-50" />
        </div>
      </div>
    </div>
  )
}
