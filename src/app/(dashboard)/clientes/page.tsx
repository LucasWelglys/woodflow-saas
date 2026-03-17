'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Cliente } from '@/types/dashboard'
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  ChevronRight 
} from 'lucide-react'
import { NewClientModal } from '@/components/dashboard/new-client-modal'

export default function ClientesPage() {
  const [loading, setLoading] = useState(true)
  const [showNewClient, setShowNewClient] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true })
    
    if (data) setClientes(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone?.includes(searchTerm)
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {showNewClient && (
        <NewClientModal 
          onClose={() => setShowNewClient(false)}
          onSuccess={() => {
            setShowNewClient(false)
            fetchClientes()
          }}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-wood-dark tracking-tight">Clientes</h2>
          <p className="text-stone-500 mt-1 font-medium">Gerencie sua base de contatos e histórico de pedidos.</p>
        </div>
        <button 
          onClick={() => setShowNewClient(true)}
          className="flex items-center gap-2 bg-wood-dark text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg hover:shadow-black/10 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-stone-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input 
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-transparent outline-none text-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm animate-pulse h-40" />
          ))
        ) : filteredClientes.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-stone-200">
            <p className="text-stone-400 font-medium">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          filteredClientes.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-stone-100 p-3 rounded-2xl group-hover:bg-wood-light transition-colors">
                  <User className="h-6 w-6 text-stone-400 group-hover:text-white" />
                </div>
                <button className="p-2 hover:bg-stone-50 rounded-lg text-stone-300 hover:text-wood-dark transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-wood-dark mb-4">{c.nome}</h3>
              <div className="space-y-2">
                {c.telefone && (
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                    <Phone className="h-3 w-3" />
                    {c.telefone}
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                    <Mail className="h-3 w-3" />
                    {c.email}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
