'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Calendar, Tag, DollarSign, Trash2, PlusCircle, Activity } from 'lucide-react'
import { adicionarDespesa, removerDespesa } from '@/app/actions/despesas'

interface Despesa {
  id: string
  descricao: string
  valor: number
  categoria: 'fixa' | 'variavel'
  data_despesa: string
}

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '',
    valor: 0,
    categoria: 'fixa' as 'fixa' | 'variavel',
    data_despesa: new Date().toISOString().split('T')[0]
  })
  const [valorStr, setValorStr] = useState('')

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: marcenaria } = await supabase
      .from('marcenarias')
      .select('id')
      .eq('dono_id', user.id)
      .single()

    if (!marcenaria) return

    const { data } = await supabase
      .from('despesas')
      .select('*')
      .eq('marcenaria_id', marcenaria.id)
      .order('data_despesa', { ascending: false })

    if (data) setDespesas(data as Despesa[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const val = Number(raw) / 100
    setNovaDespesa({ ...novaDespesa, valor: val })
    
    if (raw === '') {
      setValorStr('')
    } else {
      setValorStr(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val))
    }
  }

  const handleAddDespesa = async () => {
    if (!novaDespesa.descricao || novaDespesa.valor <= 0) return

    setUpdating(true)
    try {
      await adicionarDespesa(novaDespesa)
      setNovaDespesa({
        descricao: '',
        valor: 0,
        categoria: 'fixa',
        data_despesa: new Date().toISOString().split('T')[0]
      })
      setValorStr('')
      fetchData()
    } catch (err) {
      alert('Erro ao adicionar despesa')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Deseja excluir esta despesa?')) return

    setUpdating(true)
    try {
      await removerDespesa(id)
      fetchData()
    } catch (err) {
      alert('Erro ao excluir despesa')
    } finally {
      setUpdating(false)
    }
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const totalFormatado = fmt(despesas.reduce((acc, curr) => acc + curr.valor, 0))

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-wood-dark tracking-tight">Despesas Operacionais</h2>
          <p className="text-stone-500 mt-1 font-medium">Controle de custos fixos e variáveis da marcenaria.</p>
        </div>
        <div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl flex items-center gap-3 border border-red-100 shadow-sm">
          <Activity className="h-5 w-5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Gasto</p>
            <p className="text-xl font-black">{totalFormatado}</p>
          </div>
        </div>
      </div>

      {/* Formulário de Adição */}
      <div className="bg-white p-6 md:p-8 flex flex-col gap-6 rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100">
        <h3 className="font-bold text-wood-dark flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-wood-mid" />
          Nova Despesa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <Tag className="h-3 w-3" /> Categoria
            </label>
            <select 
              value={novaDespesa.categoria}
              onChange={e => setNovaDespesa({...novaDespesa, categoria: e.target.value as 'fixa' | 'variavel'})}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-wood-dark outline-none focus:border-wood-mid transition-all"
            >
              <option value="fixa">Custo Fixo (Aluguel, Luz...)</option>
              <option value="variavel">Custo Variável</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Descrição
            </label>
            <input 
              type="text"
              placeholder="Ex: Conta de Luz"
              value={novaDespesa.descricao}
              onChange={e => setNovaDespesa({...novaDespesa, descricao: e.target.value})}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-wood-dark outline-none focus:border-wood-mid transition-all"
            />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data
            </label>
            <input 
              type="date"
              value={novaDespesa.data_despesa}
              onChange={e => setNovaDespesa({...novaDespesa, data_despesa: e.target.value})}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-wood-dark outline-none focus:border-wood-mid transition-all"
            />
          </div>

          <div className="space-y-1.5 md:col-span-1 border-l-0 md:border-l border-stone-100 md:pl-4">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Valor
            </label>
            <input 
              type="text"
              placeholder="R$ 0,00"
              value={valorStr}
              onChange={handleValorChange}
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-lg font-black text-red-600 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all placeholder:text-stone-300"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            onClick={handleAddDespesa} 
            disabled={updating || novaDespesa.valor <= 0 || !novaDespesa.descricao}
            className="bg-wood-dark text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
          >
            {updating ? 'Salvando...' : 'Lançar Despesa'}
          </button>
        </div>
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-stone-100 bg-stone-50/30 flex justify-between items-center">
          <h3 className="font-bold text-wood-dark">Despesas Registradas</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-left">
            <thead className="bg-stone-50/50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Data</th>
                <th className="px-8 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Descrição</th>
                <th className="px-8 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Categoria</th>
                <th className="px-8 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Valor</th>
                <th className="px-8 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-10 text-center text-stone-400 font-bold uppercase text-xs">Carregando...</td></tr>
              ) : despesas.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-10 text-center text-stone-400 text-sm font-medium">Nenhuma despesa registrada.</td></tr>
              ) : (
                despesas.map((d) => (
                  <tr key={d.id} className="group hover:bg-stone-50/50 transition-colors">
                    <td className="px-8 py-4 text-xs font-bold text-stone-400">
                      {new Date(d.data_despesa).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-wood-dark">
                      {d.descricao}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        d.categoria === 'fixa' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {d.categoria}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm font-black text-red-600 text-right">
                      -{fmt(d.valor)}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <button 
                         onClick={() => handleRemove(d.id)}
                         disabled={updating}
                         className="p-2 hover:bg-red-50 text-stone-300 hover:text-red-500 rounded-lg transition-all"
                      >
                         <Trash2 className="h-4 w-4" />
                      </button>
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
