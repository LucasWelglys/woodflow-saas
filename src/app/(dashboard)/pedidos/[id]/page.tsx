'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Order, Parcel } from '@/types/dashboard'
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge'
import { 
  ChevronLeft, 
  DollarSign, 
  Receipt, 
  Package, 
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Custo {
  id: string
  categoria: string
  descricao: string
  valor: number
  data_custo: string
}

export default function DetalhePedidoPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [parcelas, setParcelas] = useState<Parcel[]>([])
  const [custos, setCustos] = useState<Custo[]>([])
  
  const [showAddCusto, setShowAddCusto] = useState(false)
  const [novoCusto, setNovoCusto] = useState({
    categoria: 'material',
    descricao: '',
    valor: 0
  })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // Fetch Order
    const { data: orderData } = await supabase
      .from('pedidos')
      .select('*, clientes(nome)')
      .eq('id', id)
      .single()

    if (orderData) {
      setOrder({
        ...orderData,
        cliente_nome: orderData.clientes?.nome || 'N/A'
      })
    }

    // Fetch Parcels
    const { data: parcelasData } = await supabase
      .from('parcelas')
      .select('*')
      .eq('pedido_id', id)
      .order('numero_parcela', { ascending: true })
    
    if (parcelasData) setParcelas(parcelasData)

    // Fetch Costs
    const { data: custosData } = await supabase
      .from('custos_projeto')
      .select('*')
      .eq('pedido_id', id)
      .order('data_custo', { ascending: false })
    
    if (custosData) setCustos(custosData)

    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function toggleParcelaStatus(pId: string, currentStatus: string) {
    const newStatus = currentStatus === 'pago' ? 'pendente' : 'pago'
    const { error } = await supabase
      .from('parcelas')
      .update({ 
        status: newStatus,
        data_recebimento: newStatus === 'pago' ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', pId)
    
    if (!error) fetchData()
  }

  async function addCusto() {
    if (!novoCusto.descricao || novoCusto.valor <= 0) return

    const { error } = await supabase
      .from('custos_projeto')
      .insert({
        pedido_id: id,
        marcenaria_id: order?.marcenaria_id,
        ...novoCusto,
        data_custo: new Date().toISOString().split('T')[0]
      })
    
    if (!error) {
      setShowAddCusto(false)
      setNovoCusto({ categoria: 'material', descricao: '', valor: 0 })
      fetchData()
    }
  }

  async function removeCusto(cId: string) {
    const { error } = await supabase.from('custos_projeto').delete().eq('id', cId)
    if (!error) fetchData()
  }

  const totalCustos = custos.reduce((acc, curr) => acc + curr.valor, 0)
  const valorPedido = order?.valor_total || 0
  const lucroReal = valorPedido - totalCustos
  const margem = valorPedido > 0 ? (lucroReal / valorPedido) * 100 : 0

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  if (loading) return <div className="p-8 animate-pulse text-stone-400 font-bold uppercase tracking-widest text-xs">Carregando detalhes...</div>
  if (!order) return <div className="p-8 text-red-500 font-bold">Pedido não encontrado.</div>

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pedidos" className="p-2 hover:bg-white rounded-xl border border-stone-200 text-stone-400 hover:text-wood-dark transition-all">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold text-wood-dark tracking-tight">Pedido #{order.numero.toString().padStart(3, '0')}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-stone-500 mt-1 font-medium">{order.cliente_nome} — {order.descricao}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Parcelas e Custos */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Módulo de Parcelas */}
          <section className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-wood-mid" />
                <h3 className="font-bold text-wood-dark">Plano de Recebimento</h3>
              </div>
            </div>
            <div className="p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-50">
                    <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Nº</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Vencimento</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Modalidade</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Valor</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {parcelas.map((p) => (
                    <tr key={p.id} className="group">
                      <td className="px-8 py-4 text-xs font-bold text-stone-400">{p.numero_parcela}º</td>
                      <td className="px-8 py-4 text-xs font-medium text-wood-dark">{new Date(p.data_vencimento).toLocaleDateString('pt-BR')}</td>
                      <td className="px-8 py-4 text-xs font-bold text-stone-500 uppercase tracking-tighter">{p.modalidade}</td>
                      <td className="px-8 py-4 text-xs font-black text-wood-dark text-right">{fmt(p.valor)}</td>
                      <td className="px-8 py-4">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => toggleParcelaStatus(p.id!, p.status)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                              p.status === 'pago' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-stone-50 text-stone-400 border border-stone-200 hover:border-wood-mid hover:text-wood-mid'
                            }`}
                          >
                            <CheckCircle2 className={`h-3 w-3 ${p.status === 'pago' ? 'fill-emerald-600 text-white' : ''}`} />
                            {p.status === 'pago' ? 'Recebido' : 'Pendente'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Módulo de Custos */}
          <section className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-wood-mid" />
                <h3 className="font-bold text-wood-dark">Custos de Produção</h3>
              </div>
              <button 
                onClick={() => setShowAddCusto(true)}
                className="text-xs font-bold text-wood-mid hover:text-wood-dark transition-colors flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Lançar Gasto
              </button>
            </div>
            
            <div className="p-8 space-y-4">
              {showAddCusto && (
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase">Categoria</label>
                      <select 
                        value={novoCusto.categoria}
                        onChange={e => setNovoCusto({...novoCusto, categoria: e.target.value})}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium"
                      >
                        <option value="material">Material (MDF/Ferragens)</option>
                        <option value="mao_de_obra">Mão de Obra</option>
                        <option value="terceirizado">Terceirizado</option>
                        <option value="frete">Frete</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase">Descrição</label>
                      <input 
                        type="text"
                        placeholder="Ex: 5 chapas MDF Branco"
                        value={novoCusto.descricao}
                        onChange={e => setNovoCusto({...novoCusto, descricao: e.target.value})}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase">Valor</label>
                      <input 
                        type="number"
                        placeholder="0,00"
                        value={novoCusto.valor}
                        onChange={e => setNovoCusto({...novoCusto, valor: Number(e.target.value)})}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowAddCusto(false)} className="text-xs font-bold text-stone-400 hover:text-stone-600 px-4">Cancelar</button>
                    <button onClick={addCusto} className="bg-wood-dark text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-black transition-all">Salvar Gasto</button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {custos.length === 0 ? (
                  <p className="text-center py-8 text-stone-400 text-sm font-medium">Nenhum custo lançado para este projeto.</p>
                ) : (
                  custos.map((c) => (
                    <div key={c.id} className="flex justify-between items-center p-4 bg-stone-50/50 rounded-2xl border border-stone-100 group">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2 border border-stone-200 rounded-lg text-[10px] font-bold text-stone-400 uppercase">
                          {c.categoria}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-wood-dark">{c.descricao}</p>
                          <p className="text-[10px] text-stone-400 font-medium">{new Date(c.data_custo).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-sm font-black text-red-600">-{fmt(c.valor)}</span>
                        <button 
                          onClick={() => removeCusto(c.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg text-stone-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar: Dashboard de Lucro Real */}
        <div className="space-y-8">
          <section className="bg-wood-dark text-white p-8 rounded-3xl shadow-2xl shadow-wood-dark/20 relative overflow-hidden">
             {/* Efeito decorativo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <div className="relative space-y-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-wood-light" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-wood-light">Lucro Real do Projeto</h3>
              </div>
              
              <div>
                <p className="text-4xl font-black tracking-tight">{fmt(lucroReal)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-md font-bold">MIRGEM: {margem.toFixed(1)}%</span>
                  {margem < 30 && <AlertCircle className="h-4 w-4 text-amber-400" />}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-wood-light font-medium">Valor Bruto</span>
                  <span className="font-bold">{fmt(valorPedido)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-wood-light font-medium">Total de Custos</span>
                  <span className="font-bold text-red-300">-{fmt(totalCustos)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold text-stone-400 uppercase tracking-widest">Ações Rápidas</h4>
            <div className="grid grid-cols-1 gap-2">
              <button disabled className="w-full py-3 bg-stone-50 text-stone-400 border border-stone-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                 Gerar Contrato PDF (Em breve)
              </button>
              <button disabled className="w-full py-3 bg-stone-50 text-stone-400 border border-stone-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                 Enviar no WhatsApp (Em breve)
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
