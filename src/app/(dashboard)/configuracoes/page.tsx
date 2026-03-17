'use client'

import { Settings, User, Bell, Shield, Palette, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { updateMarcenaria } from './actions'

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [formData, setFormData] = useState({
        nome: '',
        email: ''
    })

    const supabase = createClient()

    useEffect(() => {
        async function loadSettings() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('marcenarias')
                .select('nome, email_contato')
                .eq('dono_id', user.id)
                .single()

            if (data) {
                setFormData({
                    nome: data.nome || '',
                    email: data.email_contato || ''
                })
            }
        }
        loadSettings()
    }, [supabase])

    async function handleSave() {
        setLoading(true)
        setMessage(null)

        try {
            const result = await updateMarcenaria({
                nome: formData.nome,
                email_contato: formData.email
            })

            if (result.success) {
                setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
            } else {
                setMessage({ type: 'error', text: result.error || 'Erro ao salvar.' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro inesperado ao salvar.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-stone-800">Configurações</h1>
                <p className="text-stone-500">Gerencie as preferências da sua marcenaria e da sua conta.</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
                    message.type === 'success' 
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

                {/* Seção Sistema */}
                <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex items-center gap-3">
                        <Settings className="h-5 w-5 text-wood-dark" />
                        <h2 className="font-semibold text-stone-800">Preferências do Sistema</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                                <Bell className="h-5 w-5 text-stone-400" />
                                <div>
                                    <p className="text-sm font-medium text-stone-800">Notificações de Pedidos</p>
                                    <p className="text-xs text-stone-500">Receba alertas quando um projeto mudar de status.</p>
                                </div>
                            </div>
                            <div className="h-6 w-11 bg-stone-200 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full transition-all"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        className="px-6 py-2 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-wood-dark text-white font-medium hover:bg-wood-light transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : <><Save className="h-4 w-4" /> Salvar Alterações</>}
                    </button>
                </div>
            </div>
        </div>
    )
}