'use client'

import { useState } from 'react'
import { SaasStatsCards } from '@/core-intelligence/design-stitch/SaasStatsCards'
import { SaasLeadsTable } from '@/core-intelligence/design-stitch/SaasLeadsTable'
import { CustomerDetailModal } from '@/core-intelligence/design-stitch/CustomerDetailModal'
import { toggleMarcenariaStatus, grantTemporaryAccess } from '@/app/actions/admin-actions'
import { useRouter } from 'next/navigation'

interface Marcenaria {
  id: string
  nome: string
  whatsapp: string
  status_conta: string
  plano_atual: string
  created_at: string
  acesso_temporario_ate?: string | null
}

export default function GestaoSaasClient({ initialData }: { initialData: Marcenaria[] }) {
  const [selectedMarcenaria, setSelectedMarcenaria] = useState<Marcenaria | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  // KPIs Calculations
  const totalSubscribers = initialData.filter(m => m.status_conta === 'active' || m.status_conta === 'past_due').length
  const totalLeads = initialData.filter(m => m.status_conta === 'PENDING_APPROVAL').length
  const mrrTotal = initialData.filter(m => m.status_conta === 'active').length * 150 // Mocked value

  const onUpdateStatus = async (id: string, status: string) => {
    setIsUpdating(true)
    const res = await toggleMarcenariaStatus(id, status)
    if (res.success) {
      router.refresh()
      setSelectedMarcenaria(null)
    }
    setIsUpdating(false)
  }

  const onSaveAccess = async (id: string, hours: number) => {
    setIsUpdating(true)
    const res = await grantTemporaryAccess(id, hours)
    if (res.success) {
      router.refresh()
      setSelectedMarcenaria(null)
    }
    setIsUpdating(false)
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header com Estilo WoodFlow Organico */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-stone-200">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">SaaS Command Center</span>
          </div>
          <h1 className="text-6xl font-black text-stone-900 tracking-tighter uppercase italic leading-none">
            Gestão <span className="text-amber-500 underline decoration-stone-200 underline-offset-[12px]">SaaS</span>
          </h1>
          <p className="text-stone-500 text-sm font-medium max-w-lg leading-relaxed">
            Controle total da plataforma WoodFlow. Visualize métricas, gerencie acessos e tome decisões críticas em tempo real.
          </p>
        </div>
      </div>

      <SaasStatsCards 
        totalSubscribers={totalSubscribers} 
        totalLeads={totalLeads} 
        mrr={mrrTotal} 
      />

      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-stone-100 text-lg font-black uppercase tracking-tight">Base de Operações</h2>
            <div className="h-1 w-20 bg-amber-500 rounded-full" />
          </div>
          <span className="text-stone-600 text-[10px] font-black uppercase tracking-widest bg-stone-900 px-3 py-1 rounded-full border border-stone-800">
            {initialData.length} Marcenarias Registradas
          </span>
        </div>
        
        <SaasLeadsTable 
          data={initialData} 
          onApprove={(id) => onUpdateStatus(id, 'active')}
          onBlock={(id) => onUpdateStatus(id, 'blocked')}
          onManage={setSelectedMarcenaria}
        />
      </div>

      {selectedMarcenaria && (
        <CustomerDetailModal 
          marcenaria={selectedMarcenaria}
          onClose={() => setSelectedMarcenaria(null)}
          onUpdateStatus={onUpdateStatus}
          onSaveAccess={onSaveAccess}
        />
      )}

      {isUpdating && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-[60] flex items-center justify-center cursor-wait">
          <div className="bg-stone-900 border border-stone-800 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-black text-stone-100 uppercase tracking-widest">Sincronizando Banco...</span>
          </div>
        </div>
      )}
    </div>
  )
}
