'use client'

import { Settings, User, Bell, Save, Percent, CreditCard, TrendingUp, DollarSign } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { updateMarcenaria, getFinanceSettings, updateFinanceSettings } from './actions'

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Dados salvos no banco (para o botão cancelar)
    const [originalData, setOriginalData] = useState({ nome: '', email: '', notificacoes: false })
    const [originalFinance, setOriginalFinance] = useState({
        taxa_debito: '0',
        taxa_credito_vista: '0',
        taxa_credito_2_5: '0',
        taxa_credito_6_10: '0',
        taxa_credito_11_12: '0',
        taxa_transacao_fixa: '0',
        taxa_antecipacao: '0'
    })

    // Dados editáveis no formulário
    const [formData, setFormData] = useState({ nome: '', email: '' })
    const [notificacoes, setNotificacoes] = useState(false)
    const [marcenariaId, setMarcenariaId] = useState<string | null>(null)
    
    const [financeData, setFinanceData] = useState({
        taxa_debito: '0',
        taxa_credito_vista: '0',
        taxa_credito_2_5: '0',
        taxa_credito_6_10: '0',
        taxa_credito_11_12: '0',
        taxa_transacao_fixa: '0',
        taxa_antecipacao: '0'
    })

    const supabase = createClient()

    // Função para carregar dados
    const loadSettings = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('marcenarias')
            .select('id, nome, email_contato, notificacoes_pedidos')
            .eq('dono_id', user.id)
            .single()

        if (data) {
            setMarcenariaId(data.id)
            const loaded = {
                nome: data.nome || '',
                email: data.email_contato || '',
                notificacoes: !!data.notificacoes_pedidos
            }
            setFormData({ nome: loaded.nome, email: loaded.email })
            setNotificacoes(loaded.notificacoes)
            setOriginalData(loaded)

            // Carregar configurações financeiras
            const finResponse = await getFinanceSettings()
            if (finResponse.success && finResponse.data) {
                const fin = {
                    taxa_debito: String(finResponse.data.taxa_debito || 0),
                    taxa_credito_vista: String(finResponse.data.taxa_credito_vista || 0),
                    taxa_credito_2_5: String(finResponse.data.taxa_credito_2_5 || 0),
                    taxa_credito_6_10: String(finResponse.data.taxa_credito_6_10 || 0),
                    taxa_credito_11_12: String(finResponse.data.taxa_credito_11_12 || 0),
                    taxa_transacao_fixa: String(finResponse.data.taxa_transacao_fixa || 0),
                    taxa_antecipacao: String(finResponse.data.taxa_antecipacao || 0)
                }
                setFinanceData(fin)
                setOriginalFinance(fin)
            }
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    const handlePercentChange = (field: string, value: string) => {
        // Permite apenas números e um ponto decimal
        const cleanValue = value.replace(/[^\d.]/g, '')
        setFinanceData(prev => ({ ...prev, [field]: cleanValue }))
    }

    async function handleSave() {
        setLoading(true)
        setMessage(null)

        try {
            // Salvar Configurações Gerais
            const resultGeral = await updateMarcenaria({
                nome: formData.nome,
                email_contato: formData.email,
                notificacoes_pedidos: notificacoes
            })

            // Salvar Configurações Financeiras
            let resultFinance = { success: true }
            if (marcenariaId) {
                const numericFinance = {
                    taxa_debito: parseFloat(financeData.taxa_debito) || 0,
                    taxa_credito_vista: parseFloat(financeData.taxa_credito_vista) || 0,
                    taxa_credito_2_5: parseFloat(financeData.taxa_credito_2_5) || 0,
                    taxa_credito_6_10: parseFloat(financeData.taxa_credito_6_10) || 0,
                    taxa_credito_11_12: parseFloat(financeData.taxa_credito_11_12) || 0,
                    taxa_transacao_fixa: parseFloat(financeData.taxa_transacao_fixa) || 0,
                    taxa_antecipacao: parseFloat(financeData.taxa_antecipacao) || 0
                }
                resultFinance = await updateFinanceSettings(marcenariaId, numericFinance)
            }

            if (resultGeral.success && resultFinance.success) {
                setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
                setOriginalData({ nome: formData.nome, email: formData.email, notificacoes })
                setOriginalFinance({ ...financeData })
            } else {
                setMessage({ type: 'error', text: 'Erro ao salvar algumas configurações.' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro inesperado ao salvar.' })
        } finally {
            setLoading(false)
        }
    }

    function handleCancelar() {
        setFormData({ nome: originalData.nome, email: originalData.email })
        setNotificacoes(originalData.notificacoes)
        setFinanceData({ ...originalFinance })
        setMessage(null)
    }

    return (
        <div className="max-w-5xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800">Configurações</h1>
                <p className="text-stone-500">Gerencie as preferências da sua marcenaria e da sua conta.</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-6">
                {/* Seção Perfil */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex items-center gap-3">
                        <User className="h-5 w-5 text-wood-dark" />
                        <h2 className="font-semibold text-stone-800">Perfil da Marcenaria</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Nome da Marcenaria</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-wood-light outline-none transition-all"
                                    placeholder="Ex: Marcenaria do Lucas"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">E-mail de Contato</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-wood-light outline-none transition-all"
                                    placeholder="contato@exemplo.com"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção Taxas e Operadoras */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Percent className="h-5 w-5 text-wood-dark" />
                            <h2 className="font-semibold text-stone-800">Taxas e Operadoras</h2>
                        </div>
                        <span className="text-[10px] font-bold text-wood-mid bg-wood-light/10 px-2 py-1 rounded">Cálculo Automático Ativo</span>
                    </div>
                    <div className="p-6 space-y-8">
                        {/* Tabela de Juros */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-stone-400">
                                <CreditCard className="h-4 w-4" />
                                <h3 className="text-xs font-black uppercase tracking-widest">Tabela de Juros (Venda)</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">Débito</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={financeData.taxa_debito}
                                            onChange={e => handlePercentChange('taxa_debito', e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-stone-100 bg-stone-50/50 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-wood-light transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs shadow-sm">%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">1x Crédito</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={financeData.taxa_credito_vista}
                                            onChange={e => handlePercentChange('taxa_credito_vista', e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-stone-100 bg-stone-50/50 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-wood-light transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs">%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">2-5x</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={financeData.taxa_credito_2_5}
                                            onChange={e => handlePercentChange('taxa_credito_2_5', e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-stone-100 bg-stone-50/50 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-wood-light transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs">%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">6-10x</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={financeData.taxa_credito_6_10}
                                            onChange={e => handlePercentChange('taxa_credito_6_10', e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-stone-100 bg-stone-50/50 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-wood-light transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs">%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-stone-500 uppercase">11-12x</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={financeData.taxa_credito_11_12}
                                            onChange={e => handlePercentChange('taxa_credito_11_12', e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-stone-100 bg-stone-50/50 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-wood-light transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Taxas Operacionais */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-stone-400">
                                <TrendingUp className="h-4 w-4" />
                                <h3 className="text-xs font-black uppercase tracking-widest">Taxas Operacionais</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-stone-700">Taxa por Transação</p>
                                        <p className="text-[10px] text-stone-400 font-medium">Valor fixo cobrado por venda</p>
                                    </div>
                                    <div className="relative w-32">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[10px] font-black">R$</span>
                                        <input 
                                            type="text" 
                                            value={financeData.taxa_transacao_fixa}
                                            onChange={e => handlePercentChange('taxa_transacao_fixa', e.target.value)}
                                            className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-200 bg-white text-sm font-black text-stone-700 outline-none focus:ring-2 focus:ring-wood-light text-right transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-stone-700">Taxa de Antecipação</p>
                                        <p className="text-[10px] text-stone-400 font-medium">Custo para recebimento imediato</p>
                                    </div>
                                    <div className="relative w-32">
                                        <input 
                                            type="text" 
                                            value={financeData.taxa_antecipacao}
                                            onChange={e => handlePercentChange('taxa_antecipacao', e.target.value)}
                                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-stone-200 bg-white text-sm font-black text-stone-700 outline-none focus:ring-2 focus:ring-wood-light text-right transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção Sistema */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex items-center gap-3">
                        <Settings className="h-5 w-5 text-wood-dark" />
                        <h2 className="font-semibold text-stone-800">Preferências do Sistema</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                                <Bell className={`h-5 w-5 ${notificacoes ? 'text-wood-dark' : 'text-stone-400'}`} />
                                <div>
                                    <p className="text-sm font-medium text-stone-800">Notificações de Pedidos</p>
                                    <p className="text-xs text-stone-500">Receba alertas quando um projeto mudar de status.</p>
                                </div>
                            </div>
                            {/* Switch Interativo */}
                            <div
                                onClick={() => setNotificacoes(!notificacoes)}
                                className={`h-6 w-11 rounded-full relative cursor-pointer transition-colors duration-200 ${notificacoes ? 'bg-wood-dark' : 'bg-stone-200'}`}
                            >
                                <div className={`absolute top-1 h-4 w-4 bg-white rounded-full transition-all duration-200 ${notificacoes ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        onClick={handleCancelar}
                        className="px-8 py-3 rounded-2xl border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-3 px-10 py-3 rounded-2xl bg-wood-dark text-white font-black text-sm hover:bg-black transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : <><Save className="h-5 w-5" /> Salvar Configurações</>}
                    </button>
                </div>
            </div>
        </div>
    )
}