import { useState, useEffect } from 'react'
import { X, Save, User, Phone, Mail, MapPin, Hash, IdCard, Building, Map } from 'lucide-react'
import { createCliente, updateCliente } from '@/app/(dashboard)/clientes/actions'
import { Cliente } from '@/types/dashboard'

interface ClientModalProps {
  cliente?: Cliente | null
  onClose: () => void
  onSuccess: () => void
}

export function ClientModal({ cliente, onClose, onSuccess }: ClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: ''
  })

  // Preencher dados se for edição
  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        cpf: cliente.cpf || '',
        cep: cliente.cep || '',
        logradouro: cliente.logradouro || '',
        numero: cliente.numero || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        uf: cliente.uf || ''
      })
    }
  }, [cliente])

  // Máscara para CPF: 000.000.000-00
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    const maskedValue = value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14)
    setFormData({ ...formData, cpf: maskedValue })
  }

  // Máscara para CEP: 00000-000
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    const maskedValue = value
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9)
    setFormData({ ...formData, cep: maskedValue })
  }

  // Busca automática via ViaCEP
  useEffect(() => {
    const fetchAddress = async () => {
      const cleanCep = formData.cep.replace(/\D/g, '')
      
      if (cleanCep.length === 8) {
        // Se estivermos editando, só buscamos se o CEP for diferente do CEP original do cliente
        // para evitar sobrescrever dados já salvos logo ao abrir o modal
        if (cliente && cliente.cep && cleanCep === cliente.cep.replace(/\D/g, '')) {
          return
        }

        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
          const data = await response.json()
          
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              logradouro: data.logradouro || prev.logradouro,
              bairro: data.bairro || prev.bairro,
              cidade: data.localidade || prev.cidade,
              uf: data.uf || prev.uf
            }))
          }
        } catch (err) {
          console.error('Erro ao buscar CEP:', err)
        }
      }
    }

    const timer = setTimeout(() => {
      fetchAddress()
    }, 300) // Pequeno debounce para suavizar a experiência

    return () => clearTimeout(timer)
  }, [formData.cep, cliente])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.nome) {
      setError('O nome do cliente é obrigatório')
      setLoading(false)
      return
    }

    try {
      const result = cliente 
        ? await updateCliente(cliente.id, formData)
        : await createCliente(formData)
      
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Ocorreu um erro ao salvar o cliente')
      }
    } catch (err) {
      setError('Erro de conexão ao tentar salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-stone-100">
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-wood-dark tracking-tight">
              {cliente ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-0.5">
              {cliente ? 'Atualização de Cadastro' : 'Cadastro de Base'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-stone-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 animate-pulse mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Seção 1: Dados Pessoais */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <User className="h-4 w-4 text-wood-mid" />
                <h4 className="text-sm font-black text-stone-700 uppercase tracking-wider">Dados Pessoais</h4>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: João da Silva"
                      value={formData.nome}
                      onChange={e => setFormData({...formData, nome: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">CPF</label>
                  <div className="relative">
                    <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input 
                      type="text" 
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={handleCpfChange}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                      <input 
                        type="text" 
                        placeholder="(00) 00000-0000"
                        value={formData.telefone}
                        onChange={e => setFormData({...formData, telefone: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                      <input 
                        type="email" 
                        placeholder="cliente@email.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Endereço */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <MapPin className="h-4 w-4 text-wood-mid" />
                <h4 className="text-sm font-black text-stone-700 uppercase tracking-wider">Endereço</h4>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">CEP</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                      <input 
                        type="text" 
                        placeholder="00000-000"
                        value={formData.cep}
                        onChange={handleCepChange}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Número</label>
                    <input 
                      type="text" 
                      placeholder="123"
                      value={formData.numero}
                      onChange={e => setFormData({...formData, numero: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Logradouro (Rua)</label>
                  <input 
                    type="text" 
                    placeholder="Rua, Avenida, etc."
                    value={formData.logradouro}
                    onChange={e => setFormData({...formData, logradouro: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Bairro</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input 
                      type="text" 
                      placeholder="Bairro"
                      value={formData.bairro}
                      onChange={e => setFormData({...formData, bairro: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Cidade</label>
                    <div className="relative">
                      <Map className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                      <input 
                        type="text" 
                        placeholder="Cidade"
                        value={formData.cidade}
                        onChange={e => setFormData({...formData, cidade: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">UF</label>
                    <input 
                      type="text" 
                      maxLength={2}
                      placeholder="UF"
                      value={formData.uf}
                      onChange={e => setFormData({...formData, uf: e.target.value.toUpperCase()})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-wood-mid transition-all text-sm font-medium text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-stone-100 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 py-3 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
            >
              Cancelar
            </button>
            <div className="flex-1" />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-wood-dark text-white px-12 py-4 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
            >
              {loading ? 'Processando...' : <><Save className="h-5 w-5" /> {cliente ? 'Salvar Alterações' : 'Finalizar Cadastro'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
