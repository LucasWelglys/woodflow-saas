import { X, ShieldCheck, Mail, User, Phone, Clock, Key, Edit2, ChevronDown, Calendar } from 'lucide-react'
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
  const [tempValue, setTempValue] = useState(24)

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
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="px-10 py-8 flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest pl-0.5">Perfil do Administrador</span>
            <h3 className="text-2xl font-bold text-stone-900 tracking-tight">
              Detalhes do Cliente: <span className="text-stone-900">{marcenaria.nome}</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-all mt-1">
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <div className="px-10 pb-10 space-y-8">
          
          {/* Status Segment */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-stone-900">Status da Conta</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-current ${currentStatus.color} animate-pulse`} />
                  <span className={`text-xs font-semibold ${currentStatus.color}`}>{currentStatus.label}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => onUpdateStatus(marcenaria.id, marcenaria.status_conta === 'active' ? 'blocked' : 'active')}
              className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
            >
              <Clock className="h-4 w-4" />
              Bloquear/Desbloquear Acesso
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-stone-50/50 p-6 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Nome Completo</p>
              <p className="text-sm font-bold text-stone-900 truncate">{marcenaria.nome}</p>
            </div>
            <div className="bg-stone-50/50 p-6 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">E-mail Corporativo</p>
              <p className="text-sm font-bold text-stone-900 truncate">alexandre@empresa.com</p>
            </div>
            <div className="bg-blue-50/30 p-6 rounded-2xl space-y-1 border-l-4 border-blue-600">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Plano Atual</p>
              <p className="text-sm font-bold text-blue-700">{marcenaria.plano_atual || 'Plano Pro'}</p>
            </div>
          </div>

          {/* Temporary Access Control */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-900" />
              <h4 className="text-lg font-bold text-stone-800 tracking-tight">Controle de Acesso Temporário</h4>
            </div>

            <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100 space-y-8">
              {/* Tab Style Segmented Control */}
              <div className="flex p-1.5 bg-stone-200/50 rounded-xl max-w-md">
                {(['hora', 'dia', 'mes'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTempType(type)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      tempType === type ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    Por {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Expiration Input Mock */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Data/Hora de Término</label>
                <div className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4 shadow-sm group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-stone-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-bold text-stone-900">
                      {isTempActive 
                        ? new Date(marcenaria.acesso_temporario_ate!).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Defina o período acima'}
                    </span>
                  </div>
                  <Clock size={16} className="text-stone-300" />
                </div>
              </div>

              <button 
                onClick={() => onSaveAccess(marcenaria.id, tempType === 'hora' ? 24 : tempType === 'dia' ? 168 : 720)}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]"
              >
                <Key className="h-4 w-4" />
                Liberar Acesso Temporário
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4">
            <button className="flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors">
              <Edit2 size={16} />
              Editar Perfil
            </button>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95"
            >
              Fechar
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
