import Link from 'next/link'
import { Hammer, LayoutDashboard, Users, User, LogOut, Package, TrendingUp, Settings, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getMarcenariaContext } from '@/lib/marcenaria'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const marcenaria = await getMarcenariaContext()

  if (!marcenaria) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="w-64 bg-wood-dark text-white flex flex-col shadow-xl">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Hammer className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">WoodFlow</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-stone-300 hover:text-white group"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            href="/pedidos"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-stone-300 hover:text-white group"
          >
            <Package className="h-5 w-5" />
            <span className="font-medium">Pedidos</span>
          </Link>
          <Link
            href="/clientes"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-stone-300 hover:text-white group"
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">Clientes</span>
          </Link>
          <Link
            href="/financeiro"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-stone-300 hover:text-white group"
          >
            <TrendingUp className="h-5 w-5" />
            <span className="font-medium">Financeiro</span>
          </Link>
          <Link
            href="/despesas"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-stone-300 hover:text-white group"
          >
            <Activity className="h-5 w-5" />
            <span className="font-medium">Despesas</span>
          </Link>
          <Link
            href="/configuracoes"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-stone-300 hover:text-white group"
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Configurações</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 text-stone-400">
            <User className="h-5 w-5" />
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm truncate font-bold text-white">{marcenaria.nome}</span>
                <span className="text-[10px] truncate text-stone-500 font-medium">{marcenaria.email_contato}</span>
            </div>
          </div>
          {/* AQUI ESTÁ A CORREÇÃO DO BOTÃO SAIR */}
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-stone-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-stone-200 bg-white flex items-center px-8 justify-between sticky top-0 z-10">
          <h1 className="text-stone-500 font-medium">Dashboard Geral</h1>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-wood-light flex items-center justify-center text-white text-xs font-bold uppercase">
              {marcenaria.nome?.charAt(0)}
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}