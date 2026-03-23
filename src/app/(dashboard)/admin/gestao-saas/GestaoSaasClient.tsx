'use client'

import { useState } from 'react'
import { SaasStatsCards } from '@/core-intelligence/design-stitch/SaasStatsCards'
import { SaasLeadsTable } from '@/core-intelligence/design-stitch/SaasLeadsTable'
import { CustomerDetailModal } from '@/core-intelligence/design-stitch/CustomerDetailModal'
import { NewCustomerModal } from '@/core-intelligence/design-stitch/NewCustomerModal'
import { toggleMarcenariaStatus, grantTemporaryAccess } from '@/app/actions/admin-actions'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

interface Marcenaria {
  id: string
  nome: string
  whatsapp: string | null
  status_conta: string
  plano_atual: string
  created_at: string
  acesso_temporario_ate?: string | null
}

export default function GestaoSaasClient({ initialData }: { initialData: Marcenaria[] }) {
  const [selectedMarcenaria, setSelectedMarcenaria] = useState<Marcenaria | null>(null)
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false)
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

  const handleCreateCustomer = async (data: any) => {
    setIsUpdating(true)
    // Placeholder for actual creation logic
    console.log('Creating customer:', data)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsNewCustomerModalOpen(false)
    setIsUpdating(false)
    router.refresh()
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header Estilo Reference Design */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-stone-900 tracking-tight">
            Gestão <span className="text-stone-900">SaaS</span>
          </h1>
          <p className="text-stone-500 text-sm font-medium">
            Gerencie sua base de usuários e o ciclo de vida das assinaturas.
          </p>
        </div>
        
        <button 
          onClick={() => setIsNewCustomerModalOpen(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          + Novo Cliente
        </button>
      </div>

      <SaasStatsCards 
        totalSubscribers={totalSubscribers} 
        totalLeads={totalLeads} 
        mrr={mrrTotal} 
      />

      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-stone-900 text-lg font-black uppercase tracking-tight">Base de Operações</h2>
            <div className="h-1 w-20 bg-blue-600 rounded-full" />
          </div>
          <span className="text-stone-500 text-[10px] font-black uppercase tracking-widest bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
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

      {isNewCustomerModalOpen && (
        <NewCustomerModal 
          onClose={() => setIsNewCustomerModalOpen(false)}
          onCreate={handleCreateCustomer}
          isSubmitting={isUpdating}
        />
      )}

      {isUpdating && (
        <div className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[60] flex items-center justify-center cursor-wait">
          <div className="bg-white border border-stone-200 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-black text-stone-900 uppercase tracking-widest">Sincronizando Banco...</span>
          </div>
        </div>
      )}
    </div>
  )
}
