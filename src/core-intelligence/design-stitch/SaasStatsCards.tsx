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
        <div key={idx} className="bg-white border border-stone-200 rounded-[24px] p-6 shadow-lg hover:border-amber-500/30 transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform shadow-sm`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{stat.suffix}</span>
          </div>
          <div className="relative z-10">
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-black text-black tracking-tighter mt-0.5">{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  )
}
