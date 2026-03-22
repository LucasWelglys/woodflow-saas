'use client'

import { useState, useTransition } from 'react'
import { 
  Users, 
  Shield, 
  ShieldAlert, 
  RotateCcw, 
  Search, 
  ExternalLink, 
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye
} from 'lucide-react'
import { toggleMarcenariaStatus, grantTemporaryAccess } from '@/app/actions/admin-actions'

interface Marcenaria {
  id: string
  nome: string
  email_contato: string
  status_conta: 'active' | 'blocked' | 'trial' | 'past_due'
  acesso_temporario_ate: string | null
  cnpj_cpf: string | null
  whatsapp: string | null
  dono_id: string
}

interface AdminDashboardProps {
  marcenarias: Marcenaria[]
}

export default function AdminDashboard({ marcenarias: initialMarcenarias }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState(initialMarcenarias)
  const [isPending, startTransition] = useTransition()

  const filteredItems = items.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email_contato?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    startTransition(async () => {
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active'
      const result = await toggleMarcenariaStatus(id, newStatus as any)
      if (result.success) {
        setItems(prev => prev.map(m => m.id === id ? { ...m, status_conta: newStatus as any } : m))
      }
    })
  }

  const handleGrant24h = async (id: string) => {
    startTransition(async () => {
      const result = await grantTemporaryAccess(id, 24)
      if (result.success && result.data) {
        setItems(prev => prev.map(m => m.id === id ? { ...m, acesso_temporario_ate: result.data.acesso_temporario_ate } : m))
      }
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      blocked: 'bg-red-50 text-red-700 border-red-100',
      trial: 'bg-blue-50 text-blue-700 border-blue-100',
      past_due: 'bg-amber-50 text-amber-700 border-amber-100',
    }
    const icons = {
      active: CheckCircle2,
      blocked: ShieldAlert,
      trial: Clock,
      past_due: AlertCircle,
    }
    const label = {
      active: 'Ativa',
      blocked: 'Bloqueada',
      trial: 'Trial',
      past_due: 'Pendente',
    }
    
    const Icon = icons[status as keyof typeof icons] || HelpCircle
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status as keyof typeof styles]}`}>
        <Icon size={12} />
        {label[status as keyof typeof label]}
      </span>
    )
  }

  const getTimeRemaining = (dateStr: string | null) => {
    if (!dateStr) return null
    const end = new Date(dateStr)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    if (diff <= 0) return null
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Gestão Central WoodFlow</h1>
          <p className="text-stone-500 mt-1">Controle absoluto da infraestrutura e marcenarias.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar marcenaria..." 
            className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Marcenaria / Dono</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Acesso Temporário</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-right">Ações de Comando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.map((item) => {
                const timeLeft = getTimeRemaining(item.acesso_temporario_ate)
                return (
                  <tr key={item.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-900 flex items-center gap-2">
                          {item.nome}
                          {item.id === 'a79fdc67-2836-4889-9f73-46a311841f65' && (
                            <Shield size={14} className="text-indigo-500 fill-indigo-500/10" />
                          )}
                        </span>
                        <span className="text-xs text-stone-500">{item.email_contato}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(item.status_conta)}
                    </td>
                    <td className="px-6 py-4">
                      {timeLeft ? (
                        <div className="flex items-center gap-2 text-indigo-600">
                          <Clock size={14} />
                          <span className="text-xs font-bold">Expira em {timeLeft}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-300">Inativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleToggleStatus(item.id, item.status_conta)}
                          disabled={isPending}
                          title={item.status_conta === 'active' ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                          className={`p-2 rounded-lg transition-colors ${
                            item.status_conta === 'active' 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {item.status_conta === 'active' ? <ShieldAlert size={18} /> : <Shield size={18} />}
                        </button>
                        
                        <button 
                          onClick={() => handleGrant24h(item.id)}
                          disabled={isPending}
                          title="Liberar 24h"
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                        >
                          <RotateCcw size={18} />
                        </button>

                        <button 
                          title="Ver Detalhes"
                          className="p-2 rounded-lg text-stone-400 hover:bg-stone-100"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
