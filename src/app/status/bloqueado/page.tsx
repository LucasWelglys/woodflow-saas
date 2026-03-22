import { ShieldAlert, LogOut, MessageCircle } from 'lucide-react'

export default function BloqueadoPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
        <div className="bg-red-600 p-8 flex justify-center">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
            <ShieldAlert className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Acesso Suspenso</h1>
          <p className="text-stone-600 mb-8">
            O acesso à sua Marcenaria foi temporariamente desativado pela administração do WoodFlow ou por pendências financeiras.
          </p>

          <div className="space-y-4">
            <a 
              href="https://wa.me/5511999990000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 transition-all"
            >
              <MessageCircle size={20} />
              Falar com Suporte (WhatsApp)
            </a>

            <form action="/api/auth/signout" method="post">
              <button 
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-semibold hover:bg-stone-200 transition-all"
              >
                <LogOut size={20} />
                Sair do Sistema
              </button>
            </form>
          </div>
        </div>

        <div className="bg-stone-50 px-8 py-4 border-t border-stone-100">
          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold text-center">
            WoodFlow Enterprise Security System
          </p>
        </div>
      </div>
    </div>
  )
}
