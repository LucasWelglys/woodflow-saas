import { Users, UserPlus, TrendingUp } from 'lucide-react'

interface StatsCardsProps {
  totalSubscribers: number
  totalLeads: number
  mrr: number
}

export function SaasStatsCards({ totalSubscribers, totalLeads, mrr }: StatsCardsProps) {
  const stats = [
    {
      label: 'Total de Assinantes',
      value: totalSubscribers,
      suffix: '(Ativos)',
      icon: Users,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Total de Cadastrados',
      value: totalLeads,
      suffix: '(Leads)',
      icon: UserPlus,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Total de Receita',
      value: `R$ ${mrr.toLocaleString('pt-BR')}`,
      suffix: '(MRR)',
      icon: TrendingUp,
      color: 'text-wood-light',
      bg: 'bg-wood-light/10'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-sm hover:border-stone-700 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{stat.suffix}</span>
          </div>
          <p className="text-stone-400 text-sm font-medium">{stat.label}</p>
          <h3 className="text-2xl font-black text-stone-100 tracking-tight mt-1">{stat.value}</h3>
        </div>
      ))}
    </div>
  )
}
