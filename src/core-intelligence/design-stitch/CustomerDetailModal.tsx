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
      <div className="bg-white w-full max-w-2xl rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="px-10 py-10 flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">PERFIL DO ADMINISTRADOR</span>
            <h3 className="text-[26px] font-bold text-stone-900 leading-tight">
              Detalhes do Cliente: <span className="font-bold">{marcenaria.nome}</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-all">
            <X className="h-6 w-6 text-stone-400" />
          </button>
        </div>

        <div className="px-10 pb-10 space-y-8">
          
          {/* Status Segment */}
          <div className="bg-white border border-stone-100 rounded-[20px] p-7 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                <ShieldCheck className="h-7 w-7 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-base font-bold text-stone-900">Status da Conta</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full bg-emerald-500`} />
                  <span className={`text-[13px] font-medium text-stone-600`}>{currentStatus.label}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => onUpdateStatus(marcenaria.id, marcenaria.status_conta === 'active' ? 'blocked' : 'active')}
              className="bg-[#F1F5F9] hover:bg-stone-200 text-stone-600 px-7 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-3 transition-all active:scale-95"
            >
              <Ban className="h-4 w-4" />
              Bloquear/Desbloquear Acesso
            </button>
          </div>

          {/* Info Grid - Grey Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#F8FAFC] p-7 rounded-[20px] space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">NOME COMPLETO</p>
              <p className="text-[15px] font-bold text-stone-900 truncate">{marcenaria.nome}</p>
            </div>
            <div className="bg-[#F8FAFC] p-7 rounded-[20px] space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">E-MAIL CORPORATIVO</p>
              <p className="text-[15px] font-bold text-stone-900 truncate">alexandre@empresa.com</p>
            </div>
            <div className="bg-[#F8FAFC] p-7 rounded-[20px] space-y-1 relative overflow-hidden">
              <div className="absolute left-0 top-3 bottom-3 w-[6px] bg-blue-600 rounded-r-full" />
              <div className="pl-2">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">PLANO ATUAL</p>
                <p className="text-[15px] font-bold text-blue-700 uppercase">{marcenaria.plano_atual || 'trial'}</p>
              </div>
            </div>
          </div>

          {/* Temporary Access Control - Container Styled like Reference */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-stone-900" />
              <h4 className="text-xl font-bold text-stone-800 tracking-tight">Controle de Acesso Temporário</h4>
            </div>

            <div className="bg-[#F8FAFC] p-10 rounded-[24px] space-y-9">
              {/* Tab Selector Segmented */}
              <div className="flex p-1.5 bg-[#F1F5F9] rounded-xl max-w-lg mx-auto md:mx-0">
                {(['Por Hora', 'Por Dia', 'Por Mes'] as const).map((label) => (
                  <button
                    key={label}
                    onClick={() => setTempType(label.includes('Hora') ? 'hora' : label.includes('Dia') ? 'dia' : 'mes')}
                    className={`flex-1 py-3 text-[13px] font-bold rounded-lg transition-all ${
                      (tempType === 'hora' && label === 'Por Hora') || 
                      (tempType === 'dia' && label === 'Por Dia') || 
                      (tempType === 'mes' && label === 'Por Mes')
                        ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Data Input Box */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider ml-1">DATA/HORA DE TÉRMINO</label>
                <div className="flex items-center justify-between bg-white border border-stone-100 rounded-[14px] px-6 py-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-6 w-6 text-stone-400" />
                    <span className="text-[15px] font-bold text-stone-900">
                      {isTempActive 
                        ? new Date(marcenaria.acesso_temporario_ate!).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Defina o período acima'}
                    </span>
                  </div>
                  <Clock size={16} className="text-stone-300" />
                </div>
              </div>

              <button 
                onClick={() => onSaveAccess(marcenaria.id, 24)}
                className="w-full bg-[#1A3A8A] hover:bg-[#1E40AF] text-white py-5 rounded-[12px] font-bold text-[13px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/30 active:scale-[0.99]"
              >
                <Key className="h-5 w-5" />
                LIBERAR ACESSO TEMPORÁRIO
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6">
            <button className="flex items-center gap-2 text-[15px] font-bold text-blue-700 hover:text-blue-900 transition-colors">
              <Edit2 size={18} className="stroke-[2.5px]" />
              Editar Perfil
            </button>
            <button 
              onClick={onClose}
              className="px-10 py-3.5 bg-[#F8FAFC] hover:bg-stone-100 text-stone-600 border border-stone-200 rounded-[12px] text-[13px] font-bold uppercase tracking-widest transition-all active:scale-95"
            >
              Fechar
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
