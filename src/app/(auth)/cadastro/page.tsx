'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Hammer } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    const maskedValue = value
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
    setWhatsapp(maskedValue)
  }
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Sanitização de Email
    const sanitizedEmail = email.trim().toLowerCase()

    const { error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      const newUser = (await supabase.auth.getUser()).data.user
      
      if (newUser) {
        // Criamos a marcenaria para o novo usuário
        const { data: newMarcenaria, error: marcError } = await supabase
          .from('marcenarias')
          .insert({
            nome: name,
            dono_id: newUser.id,
            whatsapp,
            status_conta: 'PENDING_APPROVAL'
          })
          .select()
          .single()

        if (!marcError && newMarcenaria) {
          // Atualizamos o perfil com o tenant_id da nova marcenaria
          await supabase
            .from('profiles')
            .update({ tenant_id: newMarcenaria.id })
            .eq('id', newUser.id)
        }
      }

      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-stone-200 text-center">
          <div className="bg-caixa-verde/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Hammer className="h-8 w-8 text-caixa-verde" />
          </div>
          <h2 className="text-2xl font-bold text-wood-dark">Verifique seu email</h2>
          <p className="text-stone-600">
            Enviamos um link de confirmação para <strong>{email.trim().toLowerCase()}</strong>. Por favor, valide seu acesso para continuar.
          </p>
          <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-100 text-sm text-stone-500 italic">
            Importante: Após a confirmação do seu e-mail, o acesso total ao sistema dependerá da liberação por parte do administrador.
          </div>
          <div className="mt-6">
            <Link href="/login" className="text-wood-mid font-medium hover:underline">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-stone-200">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-wood-dark p-3 rounded-xl">
              <Hammer className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-wood-dark">
            Criar Conta
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Comece a gerenciar seu faturamento hoje
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">Nome da Marcenaria</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-stone-300 placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-wood-mid focus:border-wood-mid focus:z-10 sm:text-sm"
                placeholder="Nome da Marcenaria"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-stone-300 placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-wood-mid focus:border-wood-mid focus:z-10 sm:text-sm"
                placeholder="Email corporativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="whatsapp" className="sr-only">WhatsApp</label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-stone-300 placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-wood-mid focus:border-wood-mid focus:z-10 sm:text-sm"
                placeholder="WhatsApp (com DDD)"
                value={whatsapp}
                onChange={handleWhatsappChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-stone-300 placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-wood-mid focus:border-wood-mid focus:z-10 sm:text-sm"
                placeholder="Senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-wood-dark hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wood-dark transition-all disabled:opacity-50"
            >
              {loading ? 'Criando conta...' : 'Cadastrar Marcenaria'}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-stone-600">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium text-wood-mid hover:text-wood-dark">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
