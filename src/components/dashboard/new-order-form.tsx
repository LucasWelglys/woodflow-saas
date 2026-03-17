'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Save } from 'lucide-react'
import { Cliente } from '@/types/dashboard'

interface NewOrderFormProps {
  onClose: () => void
  onSuccess: () => void
}

export function NewOrderForm({ onClose, onSuccess }: NewOrderFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [clienteId, setClienteId] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])

  const [descricao, setDescricao] = useState('')
  const [valorTotal, setValorTotal] = useState<number>(0)
  
  const [parcelas, setParcelas] = useState<{
    numero: number
    valor: number
    dataVencimento: string
    modalidade: string
  }[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function fetchClientes() {
      const { data } = await supabase.from('clientes').select('id, nome')
      if (data) setClientes(data)
    }
    fetchClientes()
  }, [supabase])

  function generateInstallments() {
    if (valorTotal <= 0 || parcelas.length > 0) return
    setParcelas([{
      numero: 1,
      valor: valorTotal,
      dataVencimento: new Date().toISOString().split('T')[0],
      modalidade: 'dinheiro'
    }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!clienteId) {
      setError('Selecione um cliente')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: order, error: orderErr } = await supabase
        .from('pedidos')
        .insert({
          marcenaria_id: user.id, // Adicionado explicitamente para RLS
          cliente_id: clienteId,
          descricao,
          valor_total: valorTotal,
          status: 'orcamento'
        })
        .select()
        .single()

      if (orderErr) throw orderErr

      const parcelasData = parcelas.map(p => ({
        pedido_id: order.id,
        marcenaria_id: user.id, // Adicionado explicitamente para RLS
        numero_parcela: p.numero,
        valor: p.valor,
        data_vencimento: p.dataVencimento,
        modalidade: p.modalidade,
        status: 'pendente'
      }))

      const { error: parcErr } = await supabase.from('parcelas').insert(parcelasData)
      if (parcErr) throw parcErr

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-100">
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-wood-dark tracking-tight">Novo Pedido</h3>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-0.5">Fase de Orçamento</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Cliente</label>
              <select 
                value={clienteId} 
                onChange={e => setClienteId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
              >
                <option value="">Selecione um cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Valor do Projeto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">R$</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={valorTotal}
                  onChange={e => setValorTotal(Number(e.target.value))}
                  onBlur={generateInstallments}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-bold text-wood-dark"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Descrição do Projeto</label>
            <textarea 
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Cozinha Planejada em MDF Carvalho"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm min-h-[100px]"
            />
          </div>

          <div className="pt-4 border-t border-stone-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-wood-dark">Plano de Pagamento</h4>
              <button 
                type="button"
                onClick={() => setParcelas([...parcelas, { numero: parcelas.length + 1, valor: 0, dataVencimento: '', modalidade: 'dinheiro' }])}
                className="text-xs font-bold text-wood-mid hover:underline"
              >
                + Adicionar Parcela
              </button>
            </div>
            
            <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
              {parcelas.map((p, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-xs font-bold text-stone-400 w-8">{p.numero}º</span>
                  <input 
                    type="number" 
                    value={p.valor}
                    onChange={e => {
                      const newP = [...parcelas]
                      newP[idx].valor = Number(e.target.value)
                      setParcelas(newP)
                    }}
                    className="flex-1 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-bold" 
                  />
                  <input 
                    type="date" 
                    value={p.dataVencimento}
                    onChange={e => {
                      const newP = [...parcelas]
                      newP[idx].dataVencimento = e.target.value
                      setParcelas(newP)
                    }}
                    className="flex-1 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs" 
                  />
                  <select 
                    value={p.modalidade}
                    onChange={e => {
                      const newP = [...parcelas]
                      newP[idx].modalidade = e.target.value
                      setParcelas(newP)
                    }}
                    className="flex-1 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao_credito">Crédito</option>
                  </select>
                </div>
              ))}
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
              className="flex-2 bg-wood-dark text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : <><Save className="h-4 w-4" /> Salvar Pedido</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
