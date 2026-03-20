'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Save, Trash2 } from 'lucide-react'
import { Cliente, Order } from '@/types/dashboard'
import { updatePedido, createPedido } from '@/app/actions/pedidos'

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
    meioRecebimentoId?: string
    numParcelasCartao?: number
    seAntecipado?: boolean
  }[]>([])

  const [meiosRecebimento, setMeiosRecebimento] = useState<{id: string, nome_operadora: string, tipo: string, taxas_json: any, taxa_fixa: number, taxa_antecipacao: number}[]>([])
  const [globalNumParcelasCartao, setGlobalNumParcelasCartao] = useState(1)
  const [globalAnteciparCartao, setGlobalAnteciparCartao] = useState(false)

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

      const { data: meiosData } = await supabase
        .from('meios_recebimento')
        .select('*')
        .eq('marcenaria_id', marcenaria.id)
        .eq('ativo', true)
        
      if (meiosData) setMeiosRecebimento(meiosData)

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
          modalidade: p.modalidade,
          meioRecebimentoId: p.meio_recebimento_id,
          numParcelasCartao: p.num_parcelas_cartao,
          seAntecipado: p.se_antecipado
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
      modalidade: 'dinheiro',
      meioRecebimentoId: '',
      numParcelasCartao: 1,
      seAntecipado: false
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
        modalidade: p.modalidade,
        meio_recebimento_id: p.meioRecebimentoId || null,
        num_parcelas_cartao: (p.modalidade === 'cartao_credito' || p.modalidade === 'cartao_debito') ? globalNumParcelasCartao : 1,
        se_antecipado: (p.modalidade === 'cartao_credito' || p.modalidade === 'cartao_debito') ? globalAnteciparCartao : false
      }))

      if (editingOrder) {
        const result = await updatePedido(editingOrder.id, {
          cliente_id: clienteId,
          descricao,
          valor_total: valorTotal
        }, parcelasToSave)
        
        if (!result.success) throw new Error((result as any).error || 'Erro ao atualizar pedido')
      } else {
        const result = await createPedido({
          cliente_id: clienteId,
          descricao,
          valor_total: valorTotal
        }, parcelasToSave)
        
        if (!result.success) throw new Error((result as any).error || 'Erro ao criar pedido. Verifique os logs e cookies.')
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
                <div className="flex items-center gap-1.5 px-1 mt-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-wood-mid animate-pulse" />
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-tight">
                    O valor líquido será calculado dinamicamente pelas máquinas.
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
                  onClick={() => setParcelas([...parcelas, { 
                    numero: parcelas.length + 1, 
                    valorStr: '', 
                    valor: 0, 
                    dataVencimento: '', 
                    modalidade: 'dinheiro',
                    meioRecebimentoId: '',
                    numParcelasCartao: 1,
                    seAntecipado: false
                  }])}
                  className="text-xs font-bold text-wood-mid hover:underline"
                >
                  + Adicionar Parcela
                </button>
              )}
            </div>
            
            {parcelas.some(p => p.modalidade === 'cartao_credito' || p.modalidade === 'cartao_debito') && (
              <div className="mb-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                   <p className="text-sm font-bold text-emerald-800">Regras de Cartão (Global)</p>
                   <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest mt-0.5">Aplicadas a todas as parcelas de cartão.</p>
                </div>
                <div className="flex gap-4 items-center bg-white py-1.5 px-3 rounded-lg border border-emerald-100">
                   <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-emerald-700">Vezes na Máquina:</label>
                      <select
                         value={globalNumParcelasCartao}
                         disabled={editingOrder?.status === 'contrato'}
                         onChange={e => setGlobalNumParcelasCartao(parseInt(e.target.value))}
                         className="bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 text-xs font-bold shadow-sm outline-none text-emerald-900 focus:bg-white transition-colors"
                      >
                         {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
                      </select>
                   </div>
                   <div className="border-l border-emerald-100 pl-4">
                      <label className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold cursor-pointer hover:opacity-80 transition-opacity">
                        <input 
                          type="checkbox"
                          checked={globalAnteciparCartao}
                          disabled={editingOrder?.status === 'contrato'}
                          onChange={e => setGlobalAnteciparCartao(e.target.checked)}
                          className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        Antecipar (D+2)
                      </label>
                   </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
              {parcelas.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-stone-50 p-1.5 rounded-xl border border-stone-100 hover:border-wood-mid/30 transition-colors">
                  <span className="text-xs font-bold text-stone-400 w-5 text-center">{p.numero}º</span>
                  <div className="relative w-28">
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
                      className="w-full bg-white border border-stone-200 rounded-lg pl-6 pr-2 py-1.5 text-xs font-bold text-stone-600 disabled:opacity-60 focus:ring-1 outline-none" 
                    />
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
                    className="w-[120px] bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-medium text-stone-600 disabled:opacity-60 focus:ring-1 outline-none" 
                  />
                  
                  <select 
                    value={p.modalidade}
                    disabled={editingOrder?.status === 'contrato'}
                    onChange={e => {
                      const newP = [...parcelas]
                      newP[idx].modalidade = e.target.value
                      newP[idx].meioRecebimentoId = '' 
                      setParcelas(newP)
                    }}
                    className="w-[110px] bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-stone-600 disabled:opacity-60 focus:ring-1 outline-none"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao_credito">Crédito</option>
                    <option value="cartao_debito">Débito</option>
                    <option value="cheque">Cheque</option>
                  </select>

                  <select
                     value={p.meioRecebimentoId || ''}
                     disabled={editingOrder?.status === 'contrato'}
                     onChange={e => {
                       const newP = [...parcelas]
                       newP[idx].meioRecebimentoId = e.target.value
                       setParcelas(newP)
                     }}
                     className="flex-1 min-w-0 bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-[11px] font-medium disabled:opacity-60 text-stone-600 focus:ring-1 outline-none cursor-pointer"
                  >
                     <option value="">Operadora / Caixa</option>
                     {meiosRecebimento
                         .filter(m => {
                            if (p.modalidade === 'cartao_credito' || p.modalidade === 'cartao_debito') return m.tipo.includes('cartao')
                            return m.tipo === p.modalidade
                         })
                         .map(m => (
                           <option key={m.id} value={m.id}>{m.nome_operadora}</option>
                         ))
                     }
                  </select>

                  {editingOrder?.status !== 'contrato' && parcelas.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const newP = parcelas.filter((_, i) => i !== idx).map((parc, i) => ({ ...parc, numero: i + 1 }))
                        setParcelas(newP)
                      }}
                      className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1 border border-transparent hover:border-red-100"
                      title="Remover parcela"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-[34px] ml-1"></div>
                  )}
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
