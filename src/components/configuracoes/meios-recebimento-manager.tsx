'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Trash2, Edit2, CreditCard, Wallet, QrCode, Ticket, Building2 } from 'lucide-react'

interface MeioRecebimento {
  id: string
  nome_operadora: string
  tipo: string
  taxa_fixa: number
  taxa_antecipacao: number
  dias_recebimento: number
  taxas_json: Record<string, number>
  ativo: boolean
}

export function MeiosRecebimentoManager({ marcenariaId }: { marcenariaId: string }) {
  const [meios, setMeios] = useState<MeioRecebimento[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMeio, setEditingMeio] = useState<Partial<MeioRecebimento> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchMeios()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcenariaId])

  async function fetchMeios() {
    setLoading(true)
    const { data, error } = await supabase
      .from('meios_recebimento')
      .select('*')
      .eq('marcenaria_id', marcenariaId)
      .order('created_at', { ascending: true })

    if (data) setMeios(data)
    if (error) console.error('Erro ao buscar meios de recebimento:', error)
    setLoading(false)
  }

  async function handleSave() {
    if (!editingMeio?.nome_operadora || !editingMeio?.tipo) return
    setIsSaving(true)

    // Ajustes padrão caso não preenchidos
    const payload = {
      marcenaria_id: marcenariaId,
      nome_operadora: editingMeio.nome_operadora,
      tipo: editingMeio.tipo,
      taxa_fixa: editingMeio.taxa_fixa || 0,
      taxa_antecipacao: editingMeio.taxa_antecipacao || 0,
      dias_recebimento: editingMeio.dias_recebimento || 0,
      taxas_json: editingMeio.taxas_json || {},
      ativo: editingMeio.ativo ?? true
    }

    if (editingMeio.id) {
      await supabase.from('meios_recebimento').update(payload).eq('id', editingMeio.id)
    } else {
      await supabase.from('meios_recebimento').insert([payload])
    }

    setEditingMeio(null)
    setIsSaving(false)
    fetchMeios()
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta operadora? Histórico de parcelas antigas poderá ficar sem vínculo visual e não será possivel calcular novamente ao editar o pedido.')) return
    await supabase.from('meios_recebimento').delete().eq('id', id)
    fetchMeios()
  }

  function getIcon(tipo: string) {
    switch (tipo) {
      case 'cartao_credito':
      case 'cartao_debito': return <CreditCard className="h-4 w-4 text-emerald-600" />
      case 'boleto': return <Ticket className="h-4 w-4 text-amber-600" />
      case 'pix': return <QrCode className="h-4 w-4 text-cyan-600" />
      case 'dinheiro': return <Wallet className="h-4 w-4 text-green-600" />
      case 'cheque': return <Building2 className="h-4 w-4 text-stone-600" />
      default: return <CreditCard className="h-4 w-4 text-stone-600" />
    }
  }

  function getLabel(tipo: string) {
    switch (tipo) {
      case 'cartao_credito': return 'Cartão de Crédito'
      case 'cartao_debito': return 'Cartão de Débito'
      case 'boleto': return 'Boleto'
      case 'pix': return 'PIX'
      case 'dinheiro': return 'Dinheiro'
      case 'cheque': return 'Cheque'
      default: return tipo
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <p className="text-sm text-stone-500">Cadastre suas maquininhas, bancos e cofre direto aqui.</p>
        </div>
        <button
          onClick={() => setEditingMeio({ nome_operadora: '', tipo: 'cartao_credito', taxas_json: {} })}
          className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nova Operadora
        </button>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm animate-pulse">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meios.map(m => (
            <div key={m.id} className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col justify-between hover:border-wood-mid transition-colors group">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getIcon(m.tipo)}
                    <h4 className="font-bold text-stone-800">{m.nome_operadora}</h4>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingMeio(m)} className="p-1.5 bg-white text-stone-500 hover:text-wood-dark shadow-sm border border-stone-200 rounded-lg">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-1.5 bg-white text-stone-500 hover:text-red-500 shadow-sm border border-stone-200 rounded-lg">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white bg-stone-300 px-2 py-0.5 rounded-md inline-block mb-3">
                  {getLabel(m.tipo)}
                </span>
                
                <div className="space-y-1">
                  {m.taxa_fixa > 0 && <p className="text-xs text-stone-500">Taxa Fixa: <strong className="text-stone-700">R$ {m.taxa_fixa.toFixed(2)}</strong></p>}
                  {m.taxa_antecipacao > 0 && <p className="text-xs text-stone-500">Antecipação (D+2): <strong className="text-stone-700">{m.taxa_antecipacao}%</strong></p>}
                  {Object.keys(m.taxas_json || {}).length > 0 && (
                     <p className="text-xs text-stone-500 truncate">Taxas: {JSON.stringify(m.taxas_json)}</p>
                  )}
                  {m.dias_recebimento > 0 && <p className="text-xs text-stone-500">Cai em: D+{m.dias_recebimento}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE EDIÇÃO/CRIAÇÃO */}
      {editingMeio && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 border border-stone-100">
            <h3 className="text-xl font-extrabold text-wood-dark tracking-tight mb-6">
              {editingMeio.id ? 'Editar Operadora' : 'Nova Operadora'}
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Nome (Visível no Pedido)</label>
                <input 
                  type="text" 
                  value={editingMeio.nome_operadora} 
                  onChange={e => setEditingMeio({...editingMeio, nome_operadora: e.target.value})}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-wood-mid text-sm font-bold shadow-inner"
                  placeholder="Ex: Stone Balcão 1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Tipo de Recebimento</label>
                <select 
                  value={editingMeio.tipo} 
                  onChange={e => setEditingMeio({...editingMeio, tipo: e.target.value})}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-wood-mid text-sm font-bold shadow-inner"
                >
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="cheque">Talão de Cheque</option>
                  <option value="dinheiro">Dinheiro Físico</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Taxa Fixa (R$)</label>
                  <input 
                    type="number" step="0.01"
                    value={editingMeio.taxa_fixa || ''} 
                    onChange={e => setEditingMeio({...editingMeio, taxa_fixa: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-wood-mid text-sm font-bold shadow-inner"
                    placeholder="0.00"
                  />
                </div>
                {editingMeio.tipo === 'cartao_credito' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Taxa Antecip. (%)</label>
                    <input 
                      type="number" step="0.01"
                      value={editingMeio.taxa_antecipacao || ''} 
                      onChange={e => setEditingMeio({...editingMeio, taxa_antecipacao: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-wood-mid text-sm font-bold shadow-inner"
                      placeholder="0.00"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Dias Recebimento</label>
                  <input 
                    type="number" 
                    value={editingMeio.dias_recebimento === 0 ? '0' : editingMeio.dias_recebimento || ''} 
                    onChange={e => setEditingMeio({...editingMeio, dias_recebimento: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-wood-mid text-sm font-bold shadow-inner"
                    placeholder="D+? (Ex: 30)"
                  />
                </div>
              </div>

              {editingMeio.tipo === 'cartao_credito' && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest block">Tabela de Juros Crédito (%)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['1', '2_5', '6_10', '11_12'].map((chave) => (
                      <div key={chave} className="flex items-center gap-2">
                         <span className="text-xs font-bold text-stone-500 w-12 text-right">{chave.replace('_', '-')}x</span>
                         <input 
                           type="number" step="0.01"
                           value={(editingMeio.taxas_json || {})[chave] || ''}
                           onChange={e => setEditingMeio({
                             ...editingMeio, 
                             taxas_json: { ...editingMeio.taxas_json, [chave]: parseFloat(e.target.value) || 0 }
                           })}
                           className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg outline-none focus:border-wood-mid text-xs font-bold"
                           placeholder="0.00"
                         />
                      </div>
                    ))}
                  </div>
                </div>
              )}
               {editingMeio.tipo === 'cartao_debito' && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest block">Taxa de Débito (%)</label>
                  <input 
                    type="number" step="0.01"
                    value={(editingMeio.taxas_json || {})['debito'] || ''}
                    onChange={e => setEditingMeio({
                      ...editingMeio, 
                      taxas_json: { ...editingMeio.taxas_json, ['debito']: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg outline-none focus:border-wood-mid text-xs font-bold"
                    placeholder="Ex: 1.99"
                  />
                </div>
              )}
            </div>

            <div className="pt-6 flex gap-4 mt-4">
              <button 
                onClick={() => setEditingMeio(null)}
                className="flex-1 px-4 py-3 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || !editingMeio.nome_operadora}
                className="flex-1 bg-wood-dark text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Operadora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
