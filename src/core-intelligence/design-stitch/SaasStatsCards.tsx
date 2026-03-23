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
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Total de Cadastrados',
      value: totalLeads,
      suffix: '(Leads)',
      icon: UserPlus,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Total de Receita',
      value: `R$ ${mrr.toLocaleString('pt-BR')}`,
      suffix: '(MRR)',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white border border-stone-100 rounded-[24px] p-8 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-stone-400 text-sm font-medium">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-stone-900 tracking-tight">{stat.value}</h3>
              <span className="text-[10px] font-bold text-stone-400">{stat.suffix}</span>
            </div>
          </div>
          <div className={`p-4 rounded-2xl ${stat.bg} flex items-center justify-center`}>
            <stat.icon size={28} className={stat.color} />
          </div>
        </div>
      ))}
    </div>
  )
}
