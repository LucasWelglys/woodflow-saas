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
      color: 'text-stone-300',
      bg: 'bg-stone-800'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-[#262626] border border-stone-800/50 rounded-3xl p-8 shadow-xl hover:border-amber-500/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <stat.icon size={80} />
          </div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform shadow-lg`}>
              <stat.icon className={`h-7 w-7 ${stat.color}`} />
            </div>
            <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em]">{stat.suffix}</span>
          </div>
          <div className="relative z-10">
            <p className="text-stone-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-3xl font-black text-stone-100 tracking-tighter mt-1">{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  )
}
