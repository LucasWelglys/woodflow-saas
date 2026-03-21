'use client'

import { AlertCircle, ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function AccessBlocked() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-10 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-red-50 text-red-600 mb-6">
          <AlertCircle size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-stone-900 mb-2 italic tracking-tight">Assinatura Suspensa</h1>
        <p className="text-stone-600 mb-8 leading-relaxed">
          Parece que sua assinatura do <span className="font-bold text-stone-900 underline decoration-red-500">WoodFlow</span> não está ativa. 
          O acesso ao sistema foi temporariamente restrito.
        </p>

        <div className="space-y-4">
          <button className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-200">
            <CreditCard size={20} />
            Regularizar Assinatura
          </button>
          
          <Link 
            href="/" 
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-900 transition-colors py-2"
          >
            <ArrowLeft size={16} />
            Tentar novamente
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-stone-100 italic">
          <p className="text-xs text-stone-400">
            Dúvidas? Entre em contato com o suporte em <br/>
            <span className="text-stone-500 font-medium">suporte@woodflow.com.br</span>
          </p>
        </div>
      </div>
    </div>
  )
}
