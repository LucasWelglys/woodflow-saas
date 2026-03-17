'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Order } from '@/types/dashboard'
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge'
import { NewOrderForm } from '@/components/dashboard/new-order-form'
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

export default function PedidosPage() {
  const [loading, setLoading] = useState(true)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('pedidos')
      .select('*, clientes(nome)')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query

    const ordersTyped = (data as unknown as Order[] || []).map(o => ({
      ...o,
      cliente_nome: o.clientes?.nome || 'N/A'
    }))

    setOrders(ordersTyped)
    setLoading(false)
  }, [supabase, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter(o => 
    o.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.numero.toString().includes(searchTerm)
  )

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {showNewOrder && (
        <NewOrderForm 
          onClose={() => setShowNewOrder(false)} 
          onSuccess={() => {
            setShowNewOrder(false)
            fetchOrders()
          }} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-wood-dark tracking-tight">Gestão de Pedidos</h2>
          <p className="text-stone-500 mt-1 font-medium">Visualize e gerencie todos os contratos da sua marcenaria.</p>
        </div>
        <button 
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-2 bg-wood-dark text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg hover:shadow-black/10 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Novo Pedido
        </button>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input 
            type="text"
            placeholder="Buscar por cliente, descrição ou número..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-transparent outline-none text-sm font-medium"
          />
        </div>
        <div className="h-8 w-px bg-stone-100 hidden md:block self-center" />
        <div className="flex items-center gap-2 px-4 py-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none text-sm font-bold text-wood-dark appearance-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="orcamento">Orçamento</option>
            <option value="producao">Em Produção</option>
            <option value="entregue">Finalizado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Pedido</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Cliente / Descrição</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Valor Total</th>
                <th className="px-8 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-20 bg-stone-50/20" />
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-stone-400 font-medium">Nenhum pedido encontrado.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-stone-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-wood-dark">#{order.numero.toString().padStart(3, '0')}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-wood-dark">{order.cliente_nome}</span>
                        <span className="text-xs text-stone-400 truncate max-w-[200px]">{order.descricao}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-sm font-extrabold text-wood-dark">{fmt(order.valor_total)}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/dashboard/pedidos/${order.id}`}
                          className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-all text-stone-400 hover:text-wood-dark shadow-sm"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
