'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Save } from 'lucide-react'
import { Cliente, Order } from '@/types/dashboard'
import { updatePedido } from '@/app/actions/pedidos'
import { logAction } from '@/lib/audit'

interface NewOrderFormProps {
  onClose: () => void
  onSuccess: () => void
  editingOrder?: Order
}

export function NewOrderForm({ onClose, onSuccess, editingOrder }: NewOrderFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [taxRate, setTaxRate] = useState(0)
  const [clienteId, setClienteId] = useState(editingOrder?.cliente_id || '')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [descricao, setDescricao] = useState(editingOrder?.descricao || '')
  const [valorTotalStr, setValorTotalStr] = useState('')
  const [valorTotal, setValorTotal] = useState<number>(editingOrder?.valor_total || 0)
  const [parcelas, setParcelas] = useState<{
    numero: number
    valorStr: string
    valor: number
    dataVencimento: string
    modalidade: string
  }[]>([])

  const supabase = createClient()
  const isSubmitting = useRef(false)

  // Formata o valor total inicial se estiver editando
  useEffect(() => {
    if (editingOrder) {
      setValorTotalStr(formatCurrency((editingOrder.valor_total * 100).toString()))
    }
  }, [editingOrder])

  useEffect(() => {
    async function fetchMarcenariaData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: marcenaria, error: marcenariaErr } = await supabase
        .from('marcenarias')
        .select('id')
        .eq('dono_id', user.id)
        .single()

      if (marcenariaErr || !marcenaria) {
        console.error('Erro ao buscar marcenaria:', marcenariaErr)
        return
      }

      const { data: config } = await supabase
        .from('configuracoes_financeiras')
        .select('taxa_credito_vista')
        .eq('marcenaria_id', marcenaria.id)
        .maybeSingle()

      setTaxRate(config?.taxa_credito_vista || 0)

      const { data: clientesData } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('marcenaria_id', marcenaria.id)
      
      if (clientesData) setClientes(clientesData)
    }
    fetchMarcenariaData()
  }, [supabase])

  // Busca parcelas se estiver editando
  useEffect(() => {
    async function fetchParcelas() {
      if (!editingOrder) return
      
      const { data, error: parcErr } = await supabase
        .from('parcelas')
        .select('*')
        .eq('pedido_id', editingOrder.id)
        .order('numero_parcela', { ascending: true })

      if (data) {
        setParcelas(data.map(p => ({
          numero: p.numero_parcela,
          valor: p.valor,
          valorStr: formatCurrency((p.valor * 100).toString()),
          dataVencimento: p.data_vencimento,
          modalidade: p.modalidade
        })))
      }
    }
    fetchParcelas()
  }, [editingOrder, supabase])

  const formatCurrency = (value: string) => {
    const nums = value.replace(/\D/g, '')
    const amount = parseFloat(nums) / 100
    if (isNaN(amount)) return ''
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const parseCurrency = (formattedValue: string) => {
    return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.')) || 0
  }

  const formatBRL = (v: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  function handleValorTotalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value)
    setValorTotalStr(formatted)
    setValorTotal(parseCurrency(formatted))
    // Reset parcelas if total changed significantly, but maybe don't force for edit
    if (!editingOrder) {
        setParcelas([])
    }
  }

  function generateInstallments() {
    if (valorTotal <= 0 || parcelas.length > 0) return
    setParcelas([{
      numero: 1,
      valorStr: formatCurrency((valorTotal * 100).toString()),
      valor: valorTotal,
      dataVencimento: new Date().toISOString().split('T')[0],
      modalidade: 'dinheiro'
    }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting.current) return
    
    const somaParcelas = parcelas.reduce((acc, p) => acc + p.valor, 0)
    const saldoAParcelar = valorTotal - somaParcelas

    if (Math.abs(saldoAParcelar) > 0.01) {
      setError(`Soma das parcelas inválida. Resta parcelar: ${formatBRL(saldoAParcelar)}`)
      return
    }

    isSubmitting.current = true
    setLoading(true)
    setError(null)

    if (!clienteId) {
      setError('Selecione um cliente')
      setLoading(false)
      isSubmitting.current = false
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: marcenaria } = await supabase
        .from('marcenarias')
        .select('id')
        .eq('dono_id', user.id)
        .single()

      if (!marcenaria) throw new Error('Marcenaria não encontrada')

      const parcelasToSave = parcelas.map(p => ({
        numero_parcela: p.numero,
        valor: p.valor,
        data_vencimento: p.dataVencimento,
        modalidade: p.modalidade
      }))

      if (editingOrder) {
        const result = await updatePedido(editingOrder.id, {
          cliente_id: clienteId,
          descricao,
          valor_total: valorTotal
        }, parcelasToSave)
        
        if (!result.success) throw new Error('Erro ao atualizar pedido')
      } else {
        const { data: order, error: orderErr } = await supabase
          .from('pedidos')
          .insert({
            marcenaria_id: marcenaria.id,
            cliente_id: clienteId,
            descricao,
            valor_total: valorTotal,
            status: 'orcamento'
          })
          .select()
          .single()

        if (orderErr) throw orderErr

        const { error: parcErr } = await supabase.from('parcelas').insert(
          parcelasToSave.map(p => ({
            ...p,
            pedido_id: order.id,
            marcenaria_id: marcenaria.id,
            status: 'pendente'
          }))
        )
        if (parcErr) throw parcErr

        await logAction(supabase, marcenaria.id, 'pedidos', 'INSERT', order.id, {
          acao: 'criacao_pedido',
          cliente_id: clienteId,
          descricao,
          valor_total: valorTotal,
          parcelas_geradas: parcelasToSave.length
        })
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido')
      isSubmitting.current = false
      setLoading(false)
    }
  }

  const somaParcelas = parcelas.reduce((acc, p) => acc + p.valor, 0)
  const saldoAParcelar = valorTotal - somaParcelas
  const isSaldoZero = Math.abs(saldoAParcelar) < 0.01 && valorTotal > 0

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-100">
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-wood-dark tracking-tight">
              {editingOrder ? 'Editar Pedido' : 'Novo Pedido'}
            </h3>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-0.5">
              {editingOrder ? `Pedido #${editingOrder.numero}` : 'Fase de Orçamento'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {editingOrder?.status === 'contrato' && (
              <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                CONTRATO BLOQUEADO
              </span>
            )}
            <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
              <X className="h-5 w-5 text-stone-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Cliente</label>
              <select 
                value={clienteId} 
                onChange={e => setClienteId(e.target.value)}
                disabled={editingOrder?.status === 'contrato'}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium disabled:opacity-60"
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
                  type="text" 
                  placeholder="0,00"
                  value={valorTotalStr}
                  onChange={handleValorTotalChange}
                  onBlur={generateInstallments}
                  disabled={editingOrder?.status === 'contrato'}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-bold text-wood-dark disabled:opacity-60"
                />
              </div>
              {valorTotal > 0 && (
                <div className="flex items-center gap-1.5 px-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                    Líquido estimado: <span className="text-stone-800 ml-1">{formatBRL(valorTotal * (1 - taxRate / 100))}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Descrição do Projeto</label>
            <textarea 
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              disabled={editingOrder?.status === 'contrato'}
              placeholder="Ex: Cozinha Planejada em MDF Carvalho"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm min-h-[100px] disabled:opacity-60"
            />
          </div>

          <div className="pt-4 border-t border-stone-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h4 className="text-sm font-bold text-wood-dark">Plano de Pagamento</h4>
                {valorTotal > 0 && (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                    isSaldoZero 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                  }`}>
                    {isSaldoZero ? 'SALDO ZERADO' : `SALDO A PARCELAR: ${formatBRL(saldoAParcelar)}`}
                  </span>
                )}
              </div>
              {editingOrder?.status !== 'contrato' && (
                <button 
                  type="button"
                  onClick={() => setParcelas([...parcelas, { numero: parcelas.length + 1, valorStr: '', valor: 0, dataVencimento: '', modalidade: 'dinheiro' }])}
                  className="text-xs font-bold text-wood-mid hover:underline"
                >
                  + Adicionar Parcela
                </button>
              )}
            </div>
            
            <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
              {parcelas.map((p, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-xs font-bold text-stone-400 w-8">{p.numero}º</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-[10px] font-bold">R$</span>
                    <input 
                      type="text" 
                      placeholder="0,00"
                      value={p.valorStr}
                      disabled={editingOrder?.status === 'contrato'}
                      onChange={e => {
                        const formatted = formatCurrency(e.target.value)
                        const newP = [...parcelas]
                        newP[idx].valorStr = formatted
                        newP[idx].valor = parseCurrency(formatted)
                        setParcelas(newP)
                      }}
                      className="w-full bg-white border border-stone-200 rounded-lg pl-7 pr-2 py-1.5 text-xs font-bold text-stone-600 disabled:opacity-60" 
                    />
                  </div>
                  <div className="flex flex-col items-end w-24 px-2">
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Líquido</span>
                    <span className="text-[10px] font-black text-emerald-600">{formatBRL(p.valor * (1 - taxRate / 100))}</span>
                  </div>
                  <input 
                    type="date" 
                    value={p.dataVencimento}
                    disabled={editingOrder?.status === 'contrato'}
                    onChange={e => {
                      const newP = [...parcelas]
                      newP[idx].dataVencimento = e.target.value
                      setParcelas(newP)
                    }}
                    className="flex-1 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs disabled:opacity-60" 
                  />
                  <select 
                    value={p.modalidade}
                    disabled={editingOrder?.status === 'contrato'}
                    onChange={e => {
                      const newP = [...parcelas]
                      newP[idx].modalidade = e.target.value
                      setParcelas(newP)
                    }}
                    className="flex-1 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs disabled:opacity-60"
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
            {editingOrder?.status !== 'contrato' && (
              <button 
                type="submit" 
                disabled={loading || !isSaldoZero || parcelas.length === 0}
                className="flex-2 bg-wood-dark text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : <><Save className="h-4 w-4" /> Salvar Pedido</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
