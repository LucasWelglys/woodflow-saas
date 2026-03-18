'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'
import { Order } from '@/types/dashboard'
import { NewOrderForm } from './new-order-form'
import { deletePedido } from '@/app/actions/pedidos'

interface OrdersTableProps {
  orders: Order[]
  loading?: boolean
}

export function OrdersTable({ orders, loading }: OrdersTableProps) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center px-6 py-4 border-b border-stone-100 last:border-0">
              <Skeleton className="h-4 w-12 mr-8" />
              <Skeleton className="h-4 w-40 mr-auto" />
              <Skeleton className="h-4 w-24 mr-8" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    orcamento: 'bg-stone-100 text-stone-600',
    producao: 'bg-blue-100 text-blue-600',
    entrega: 'bg-amber-100 text-amber-600',
    finalizado: 'bg-emerald-100 text-emerald-600',
    fechado: 'bg-indigo-100 text-indigo-600',
  }

  async function handleDelete() {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      await deletePedido(deletingId)
      setDeletingId(null)
    } catch (err) {
      alert('Erro ao excluir pedido: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
          <h3 className="font-bold text-wood-dark tracking-tight">Pedidos Recentes</h3>
          <button className="text-sm font-medium text-wood-mid hover:text-wood-dark transition-colors">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Nº</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Projeto / Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-mono text-stone-500">#{order.numero}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-wood-dark tracking-tight">{order.descricao}</p>
                    <p className="text-xs text-stone-400 font-medium">{order.cliente_nome || order.clientes?.nome}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-wood-dark text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.valor_total)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${statusColors[order.status] || 'bg-stone-100'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => setEditingOrder(order)}
                            className="p-1.5 text-stone-400 hover:text-wood-dark transition-colors rounded-lg hover:bg-white border border-transparent hover:border-stone-100"
                            title="Editar Pedido"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={() => setDeletingId(order.id)}
                            className="p-1.5 text-stone-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white border border-transparent hover:border-stone-100"
                            title="Excluir Pedido"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm text-stone-400 font-medium italic">Nenhum pedido encontrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      {editingOrder && (
        <NewOrderForm 
            onClose={() => setEditingOrder(null)}
            onSuccess={() => setEditingOrder(null)}
            editingOrder={editingOrder}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingId && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-stone-100 text-center">
            <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-stone-800 mb-2">Excluir Pedido?</h3>
            <p className="text-stone-500 text-sm mb-8">
              Esta ação é irreversível. Todas as parcelas vinculadas a este pedido serão removidas do financeiro.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-2xl border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
