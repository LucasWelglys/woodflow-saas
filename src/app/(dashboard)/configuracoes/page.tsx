'use client'

import { Settings, User, Bell, Save, Percent, CreditCard, TrendingUp, DollarSign } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { updateMarcenaria } from './actions'
import { MeiosRecebimentoManager } from '@/components/configuracoes/meios-recebimento-manager'

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [originalData, setOriginalData] = useState({ nome: '', email: '', notificacoes: false })

    // Dados editáveis no formulário do Perfil e Sistema
    const [formData, setFormData] = useState({ nome: '', email: '' })
    const [notificacoes, setNotificacoes] = useState(false)
    const [marcenariaId, setMarcenariaId] = useState<string | null>(null)

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
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        loadSettings()
    }, [loadSettings])


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

            if (resultGeral.success) {
                setMessage({ type: 'success', text: 'Configurações do perfil salvas com sucesso!' })
                setOriginalData({ nome: formData.nome, email: formData.email, notificacoes })
            } else {
                setMessage({ type: 'error', text: 'Erro ao salvar configurações do perfil.' })
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

                {/* Seção Taxas e Operadoras Componentizada */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex items-center gap-3">
                        <Percent className="h-5 w-5 text-wood-dark" />
                        <h2 className="font-semibold text-stone-800">Meios de Recebimento e Taxas</h2>
                    </div>
                    <div className="p-6">
                        {marcenariaId && <MeiosRecebimentoManager marcenariaId={marcenariaId} />}
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