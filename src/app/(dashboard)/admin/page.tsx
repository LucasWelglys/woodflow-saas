'use client'

import { LayoutDashboard, Users, CreditCard, Settings, ChevronRight } from 'lucide-react'

export default function AdminDashboard() {
  const stats = [
    { label: 'Total de Clientes', value: '1', icon: Users, color: 'text-blue-600' },
    { label: 'Assinaturas Ativas', value: '1', icon: CreditCard, color: 'text-green-600' },
    { label: 'Faturamento Mensal', value: 'R$ 0,00', icon: LayoutDashboard, color: 'text-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Painel do Dono</h1>
            <p className="text-stone-500 mt-1">Gerencie a infraestrutura SaaS do WoodFlow.</p>
          </div>
          <div className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Settings size={16} />
            Configurações do Sistema
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl bg-stone-50 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Geral</span>
              </div>
              <p className="text-stone-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-stone-900">Clientes Recentes (Marcenarias)</h2>
            <button className="text-sm font-semibold text-stone-600 flex items-center gap-1 hover:text-stone-900 transition-colors">
              Ver todos <ChevronRight size={16} />
            </button>
          </div>
          <div className="p-0">
             <div className="p-8 text-center">
                <div className="inline-flex p-4 rounded-full bg-stone-50 text-stone-400 mb-4">
                  <Users size={32} />
                </div>
                <h3 className="text-stone-900 font-semibold text-lg">Nenhuma nova marcenaria hoje</h3>
                <p className="text-stone-500 max-w-sm mx-auto mt-2 text-sm">
                  Assim que novos clientes se cadastrarem no SaaS, eles aparecerão nesta lista para gestão de limites e assinaturas.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
