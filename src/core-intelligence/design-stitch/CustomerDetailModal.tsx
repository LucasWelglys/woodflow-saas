import { X, User, Phone, ShieldCheck, Clock, Calendar } from 'lucide-react'
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
  const [tempHours, setTempHours] = useState(24)

  const isTempActive = marcenaria.acesso_temporario_ate 
    ? new Date(marcenaria.acesso_temporario_ate) > new Date()
    : false

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-10 py-8 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-stone-900 tracking-tighter uppercase italic">
              Detalhes de <span className="text-blue-600">Marcenaria</span>
            </h3>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
              WoodFlow SaaS Command Center
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full transition-all border border-stone-200">
            <X className="h-5 w-5 text-stone-500" />
          </button>
        </div>

        <div className="p-10 space-y-8">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nome da Marcenaria</label>
              <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4">
                <User className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-bold text-stone-900">{marcenaria.nome}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">WhatsApp</label>
              <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4">
                <Phone className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-bold text-stone-900">{marcenaria.whatsapp || 'Não informado'}</span>
              </div>
            </div>
          </div>

          {/* Status e Ações Rápidas */}
          <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Status da Conta
              </h4>
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border-none uppercase tracking-wider ${
                marcenaria.status_conta === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                marcenaria.status_conta === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600' :
                'bg-red-50 text-red-500'
              }`}>
                {marcenaria.status_conta.toUpperCase()}
              </span>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => onUpdateStatus(marcenaria.id, 'active')}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Ativar / Aprovar
              </button>
              <button 
                onClick={() => onUpdateStatus(marcenaria.id, 'blocked')}
                className="flex-1 py-4 bg-white border border-stone-200 text-stone-500 hover:text-red-600 hover:border-red-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Bloquear Acesso
              </button>
            </div>
          </div>

          {/* Acesso Temporário */}
          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="h-20 w-20 text-blue-600" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest leading-none">Acesso Temporário de Emergência</h4>
              </div>

              {isTempActive && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 font-bold">
                    Ativo até {new Date(marcenaria.acesso_temporario_ate!).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <select 
                  value={tempHours}
                  onChange={(e) => setTempHours(Number(e.target.value))}
                  className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm text-stone-900 outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-bold appearance-none shadow-sm"
                >
                  <option value={1}>1 Hora</option>
                  <option value={4}>4 Horas</option>
                  <option value={12}>12 Horas</option>
                  <option value={24}>24 Horas</option>
                  <option value={48}>48 Horas</option>
                  <option value={168}>1 Semana</option>
                </select>
                <button 
                  onClick={() => onSaveAccess(marcenaria.id, tempHours)}
                  className="px-8 py-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  Conceder
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-stone-50 p-6 px-10 flex justify-end gap-3 border-t border-stone-100">
          <button 
            onClick={onClose}
            className="px-8 py-2 text-stone-400 hover:text-stone-900 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
