import { X, Save, User, Phone, Mail, Clock, ShieldCheck, ShieldAlert, Calendar } from 'lucide-react'
import { useState } from 'react'

interface Marcenaria {
  id: string
  nome: string
  whatsapp: string
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
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-10 py-8 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-stone-900 tracking-tighter uppercase italic">
              Detalhes de <span className="text-amber-500">Marcenaria</span>
            </h3>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
              WoodFlow SaaS Command
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
                <User className="h-4 w-4 text-amber-500" />
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
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                Status da Conta
              </h4>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                marcenaria.status_conta === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                marcenaria.status_conta === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {marcenaria.status_conta.toUpperCase()}
              </span>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => onUpdateStatus(marcenaria.id, 'active')}
                className="flex-1 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
              >
                Ativar / Aprovar
              </button>
              <button 
                onClick={() => onUpdateStatus(marcenaria.id, 'blocked')}
                className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg"
              >
                Bloquear
              </button>
            </div>
          </div>

          {/* Acesso Temporário */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="h-20 w-20 text-stone-700" />
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-500" />
                <h4 className="text-xs font-black text-stone-100 uppercase tracking-widest">Controle de Acesso Temporário</h4>
              </div>

              {isTempActive && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-500 font-bold">
                    Ativo até: {new Date(marcenaria.acesso_temporario_ate!).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4">
                <select 
                  value={tempHours}
                  onChange={(e) => setTempHours(Number(e.target.value))}
                  className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-200 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-bold appearance-none"
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
                  className="px-6 py-3 bg-stone-100 text-stone-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl"
                >
                  Conceder
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-stone-900/50 p-6 flex justify-end gap-3 border-t border-stone-900">
          <button 
            onClick={onClose}
            className="px-8 py-3 text-stone-400 hover:text-stone-100 text-xs font-black uppercase tracking-widest transition-colors"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  )
}
