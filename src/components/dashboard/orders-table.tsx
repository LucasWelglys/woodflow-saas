'use client'

import { MoreHorizontal } from 'lucide-react'

interface Order {
  id: string
  numero: number
  descricao: string
  valor_total: number
  status: string
  cliente_nome: string
  created_at: string
}

interface OrdersTableProps {
  orders: Order[]
  loading?: boolean
}

import { Skeleton } from '../ui/skeleton'

export function OrdersTable({ orders, loading }: OrdersTableProps) {
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
    finalizado: 'bg-caixa-verde/10 text-caixa-verde',
  }

  return (
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
              <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-stone-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm font-mono text-stone-500">#{order.numero}</td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-wood-dark tracking-tight">{order.descricao}</p>
                  <p className="text-xs text-stone-400 font-medium">{order.cliente_nome}</p>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-wood-dark text-right">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.valor_total)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusColors[order.status] || 'bg-stone-100'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-stone-400 hover:text-wood-dark transition-colors rounded-lg hover:bg-white border border-transparent hover:border-stone-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
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
  )
}
