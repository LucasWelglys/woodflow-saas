import { X, ShieldCheck, Clock, Key, Edit2, Calendar, Ban } from 'lucide-react'
import { useState } from 'react'

interface Marcenaria {
  id: string
  nome: string
  whatsapp: string | null
  status_conta: string
  plano_atual: string
  acesso_temporario_ate?: string | null
}

interface ModalProps {
  marcenaria: Marcenaria
  onClose: () => void
  onSaveAccess: (id: string, hours: number) => void
  onUpdateStatus: (id: string, status: string) => void
}

export function CustomerDetailModal({ marcenaria, onClose, onSaveAccess, onUpdateStatus }: ModalProps) {
  const [tempType, setTempType] = useState<'hora' | 'dia' | 'mes'>('hora')

  const isTempActive = marcenaria.acesso_temporario_ate 
    ? new Date(marcenaria.acesso_temporario_ate) > new Date()
    : false

  const statusMap: Record<string, { label: string, color: string }> = {
    active: { label: 'Ativo e Verificado', color: 'text-emerald-500' },
    PENDING_APPROVAL: { label: 'Pendente de Aprovação', color: 'text-amber-500' },
    blocked: { label: 'Acesso Bloqueado', color: 'text-red-500' }
  }

  const currentStatus = statusMap[marcenaria.status_conta] || { label: 'Status Desconhecido', color: 'text-stone-400' }

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="px-10 py-10 flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">PERFIL DO ADMINISTRADOR</span>
            <h3 className="text-xl font-bold text-stone-900 leading-tight">
              Detalhes do Cliente: <span className="font-bold">{marcenaria.nome}</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-all">
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <div className="px-10 pb-10 space-y-8">
          
          {/* Status Segment */}
          <div className="bg-white border border-stone-100 rounded-[20px] p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-stone-900">Status da Conta</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-emerald-500`} />
                  <span className={`text-[11px] font-medium text-stone-500`}>{currentStatus.label}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => onUpdateStatus(marcenaria.id, marcenaria.status_conta === 'active' ? 'blocked' : 'active')}
              className="bg-stone-50 hover:bg-stone-100 text-stone-600 px-5 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
            >
              <Ban className="h-3.5 w-3.5" />
              Bloquear/Desbloquear Acesso
            </button>
          </div>

          {/* Info Grid - Shrunk Fonts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-stone-50/50 p-6 rounded-2xl space-y-1">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">NOME COMPLETO</p>
              <p className="text-xs font-bold text-stone-900 truncate uppercase">{marcenaria.nome}</p>
            </div>
            <div className="bg-stone-50/50 p-6 rounded-2xl space-y-1">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">E-MAIL CORPORATIVO</p>
              <p className="text-xs font-bold text-stone-900 truncate">alexandre@empresa.com</p>
            </div>
            <div className="bg-stone-50/50 p-6 rounded-2xl space-y-1 relative overflow-hidden">
              <div className="absolute left-0 top-3 bottom-3 w-[4px] bg-blue-600 rounded-r-full" />
              <div className="pl-1">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">PLANO ATUAL</p>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-tight">{marcenaria.plano_atual || 'trial'}</p>
              </div>
            </div>
          </div>

          {/* Temporary Access Control - Redone like Image 2 */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-stone-800" />
              <h4 className="text-base font-bold text-stone-800 tracking-tight">Controle de Acesso Temporário</h4>
            </div>

            <div className="bg-stone-50 rounded-3xl p-10 border border-stone-100/50 space-y-8">
              {/* Tab Selector Segmented - High Fidelity */}
              <div className="flex p-1 bg-stone-200/50 rounded-xl max-w-sm">
                {(['Por Hora', 'Por Dia', 'Por Mes'] as const).map((label) => {
                  const type = label.includes('Hora') ? 'hora' : label.includes('Dia') ? 'dia' : 'mes'
                  return (
                    <button
                      key={label}
                      onClick={() => setTempType(type)}
                      className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${
                        tempType === type ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Data Input Box */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">DATA/HORA DE TÉRMINO</label>
                <div className="flex items-center justify-between bg-white border border-stone-200/60 rounded-xl px-5 py-4 shadow-sm group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-stone-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-bold text-stone-900">
                      {isTempActive 
                        ? new Date(marcenaria.acesso_temporario_ate!).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Defina o período acima'}
                    </span>
                  </div>
                  <Clock size={14} className="text-stone-300" />
                </div>
              </div>

              <button 
                onClick={() => onSaveAccess(marcenaria.id, 24)}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]"
              >
                <Key className="h-4 w-4" />
                LIBERAR ACESSO TEMPORÁRIO
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4">
            <button className="flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors">
              <Edit2 size={14} />
              Editar Perfil
            </button>
            <button 
              onClick={onClose}
              className="px-8 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95"
            >
              Fechar
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
