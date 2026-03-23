import { X, User, Mail, Phone, ShieldCheck, ChevronDown, Check } from 'lucide-react'
import { useState } from 'react'

interface NewCustomerModalProps {
  onClose: () => void
  onCreate: (data: any) => void
  isSubmitting?: boolean
}

export function NewCustomerModal({ onClose, onCreate, isSubmitting }: NewCustomerModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    plano: 'Pro Architect',
    status: 'Pending',
    liberarAcesso: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(formData)
  }

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-10 py-8 flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-blue-900 tracking-tight">
              Novo Cliente
            </h3>
            <p className="text-stone-400 text-sm font-medium">
              Registre um novo parceiro na plataforma WoodFlow.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-all">
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-10 pb-10 space-y-8">
          {/* Nome Completo */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Nome Completo</label>
            <input
              type="text"
              required
              placeholder="Ex: João Silva"
              className="w-full bg-white border border-stone-200 rounded-xl px-5 py-4 text-sm text-stone-900 placeholder:text-stone-300 outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600/30 transition-all font-medium"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <input
                type="email"
                required
                placeholder="nome@empresa.com.br"
                className="w-full bg-white border border-stone-200 rounded-xl px-5 py-4 text-sm text-stone-900 placeholder:text-stone-300 outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600/30 transition-all font-medium"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Telefone</label>
              <input
                type="text"
                required
                placeholder="(11) 99999-9999"
                className="w-full bg-white border border-stone-200 rounded-xl px-5 py-4 text-sm text-stone-900 placeholder:text-stone-300 outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600/30 transition-all font-medium"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
          </div>

          {/* Plano e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Plano</label>
              <div className="relative">
                <select
                  className="w-full bg-white border border-stone-200 rounded-xl px-5 py-4 text-sm text-stone-900 outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600/30 transition-all font-bold appearance-none"
                  value={formData.plano}
                  onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
                >
                  <option value="Plano Pro">Plano Pro</option>
                  <option value="Plano Enterprise">Plano Enterprise</option>
                  <option value="Plano Legacy">Plano Legacy</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Status Inicial</label>
              <div className="relative">
                <select
                  className="w-full bg-white border border-stone-200 rounded-xl px-5 py-4 text-sm text-stone-900 outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600/30 transition-all font-bold appearance-none"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Toggle Liberar Acesso */}
          <div className="bg-stone-50 rounded-2xl p-6 flex items-start gap-4 border border-stone-100/50">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, liberarAcesso: !formData.liberarAcesso })}
              className={`mt-1 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.liberarAcesso ? 'bg-blue-600' : 'bg-stone-200'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.liberarAcesso ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <div className="space-y-1">
              <p className="text-sm font-bold text-stone-900">Liberar acesso ao sistema agora?</p>
              <p className="text-xs text-stone-500 font-medium">O cliente receberá um e-mail com as credenciais imediatamente.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-bold text-stone-500 hover:text-stone-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Criar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
