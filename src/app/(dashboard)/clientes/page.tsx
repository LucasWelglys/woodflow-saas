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
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { ClientModal } from '@/components/dashboard/client-modal'
import { deleteCliente } from '@/app/(dashboard)/clientes/actions'

export default function ClientesPage() {
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setShowModal(true)
  }

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    setDeleteError(null)
    
    try {
      const result = await deleteCliente(deleteId)
      if (result.success) {
        setDeleteId(null)
        fetchClientes()
      } else {
        setDeleteError(result.error || 'Não foi possível excluir o cliente.')
      }
    } catch (err) {
      setDeleteError('Erro de conexão ao excluir.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone?.includes(searchTerm)
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {showModal && (
        <ClientModal 
          cliente={selectedCliente}
          onClose={() => {
            setShowModal(false)
            setSelectedCliente(null)
          }}
          onSuccess={() => {
            setShowModal(false)
            setSelectedCliente(null)
            fetchClientes()
          }}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-stone-100 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-50 rounded-full">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-stone-800 tracking-tight">Tem certeza?</h3>
                <p className="text-stone-500 text-sm font-medium">Esta ação não poderá ser desfeita. O cliente e todos os seus dados serão permanentemente excluídos.</p>
              </div>

              {deleteError && (
                <div className="flex items-start gap-2 bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex flex-col w-full gap-2 pt-4">
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-red-700 transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {isDeleting ? 'Excluindo...' : 'Sim, Excluir Cliente'}
                </button>
                <button 
                  onClick={() => setDeleteId(null)}
                  disabled={isDeleting}
                  className="w-full bg-stone-100 text-stone-600 px-6 py-3 rounded-xl font-black text-sm hover:bg-stone-200 transition-colors active:scale-[0.98] disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-wood-dark tracking-tight">Clientes</h2>
          <p className="text-stone-500 mt-1 font-medium">Gerencie sua base de contatos e histórico de pedidos.</p>
        </div>
        <button 
          onClick={() => {
            setSelectedCliente(null)
            setShowModal(true)
          }}
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
            <div key={c.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 transform translate-x-12 group-hover:translate-x-0 transition-transform flex gap-2">
                <button 
                  onClick={() => handleEdit(c)}
                  className="p-3 bg-stone-100 text-stone-600 hover:bg-wood-mid hover:text-white rounded-2xl transition-all shadow-md active:scale-90"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDeleteRequest(c.id)}
                  className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-md active:scale-90"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="bg-stone-100 p-3 rounded-2xl group-hover:bg-wood-light transition-colors">
                  <User className="h-6 w-6 text-stone-400 group-hover:text-white" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-wood-dark mb-4 pr-16 truncate">{c.nome}</h3>
              
              <div className="space-y-2">
                {c.telefone && (
                  <div className="flex items-center gap-3 text-xs font-bold text-stone-500">
                    <div className="w-6 h-6 flex items-center justify-center bg-stone-50 rounded-lg group-hover:bg-stone-100 transition-colors">
                      <Phone className="h-3 w-3" />
                    </div>
                    {c.telefone}
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-3 text-xs font-bold text-stone-500">
                    <div className="w-6 h-6 flex items-center justify-center bg-stone-50 rounded-lg group-hover:bg-stone-100 transition-colors">
                      <Mail className="h-3 w-3" />
                    </div>
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                
                {(c.cidade || c.uf) && (
                  <div className="pt-2 mt-2 border-t border-stone-50 flex items-center gap-3 text-xs font-medium text-stone-400">
                     <span className="bg-stone-50 px-2 py-0.5 rounded italic">
                       {c.cidade}{c.uf ? `, ${c.uf}` : ''}
                     </span>
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
