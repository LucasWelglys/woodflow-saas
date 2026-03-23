import { Clock, LogOut, MessageCircle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function AguardandoAprovacaoPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
        <div className="bg-wood-dark p-8 flex justify-center">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm relative">
            <Clock className="h-12 w-12 text-white animate-pulse" />
            <ShieldCheck className="h-6 w-6 text-caixa-verde absolute -top-1 -right-1 bg-white rounded-full p-0.5" />
          </div>
        </div>
        
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Quase lá!</h1>
          <p className="text-stone-600 mb-8 leading-relaxed">
            Olá! Recebemos seu cadastro. O administrador (Lucas) está configurando sua oficina digital. 
            Você receberá um aviso no seu WhatsApp assim que o acesso for liberado!
          </p>

          <div className="space-y-4">
            <a 
              href="https://wa.me/5573991679597" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-wood-dark text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-wood-dark/20"
            >
              <MessageCircle size={20} />
              Falar com o Lucas (Suporte)
            </a>

            <form action="/api/auth/signout" method="post">
              <button 
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-3 bg-stone-100 text-stone-500 rounded-xl font-semibold hover:bg-stone-200 transition-all"
              >
                <LogOut size={18} />
                Sair do Sistema
              </button>
            </form>
          </div>
        </div>

        <div className="bg-stone-50 px-8 py-4 border-t border-stone-100 italic">
          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold text-center">
            WoodFlow Enterprise • Onboarding System
          </p>
        </div>
      </div>
    </div>
  )
}
