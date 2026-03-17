'use client'

import { useState } from 'react'
import { X, Save, User, Phone, Mail } from 'lucide-react'
import { createCliente } from '@/app/(dashboard)/clientes/actions'

interface NewClientModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function NewClientModal({ onClose, onSuccess }: NewClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.nome) {
      setError('O nome do cliente é obrigatório')
      setLoading(false)
      return
    }

    try {
      const result = await createCliente(formData)
      
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Ocorreu um erro ao salvar o cliente')
      }
    } catch (err) {
      setError('Erro de conexão ao tentar salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-100">
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-wood-dark tracking-tight">Novo Cliente</h3>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-0.5">Cadastro de Base</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                <input 
                  type="text" 
                  required
                  placeholder="Ex: João da Silva"
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">WhatsApp / Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                <input 
                  type="text" 
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={e => setFormData({...formData, telefone: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                <input 
                  type="email" 
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-wood-dark text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : <><Save className="h-4 w-4" /> Salvar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
