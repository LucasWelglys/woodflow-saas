import { LucideIcon } from 'lucide-react'

interface SummaryCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'error'
  loading?: boolean
}

import { Skeleton } from '../ui/skeleton'

export function SummaryCard({ title, value, subtitle, icon: Icon, variant = 'default', loading }: SummaryCardProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-40" />
      </div>
    )
  }

  const variants = {
    default: 'text-stone-500',
    success: 'text-caixa-verde',
    warning: 'text-alerta-laranja',
    error: 'text-erro-vermelho'
  }

  return (
    <div className={`bg-white p-6 rounded-2xl border border-stone-200 shadow-sm transition-all hover:shadow-md ${variant === 'error' ? 'border-l-4 border-l-erro-vermelho' : ''}`}>
      <div className="flex justify-between items-start">
        <p className={`text-xs font-bold uppercase tracking-wider ${variants[variant]}`}>{title}</p>
        <Icon className={`h-5 w-5 ${variants[variant]} opacity-70`} />
      </div>
      <p className="text-2xl font-bold text-wood-dark mt-2 tracking-tight">{value}</p>
      <p className="text-xs text-stone-400 mt-2 font-medium">{subtitle}</p>
    </div>
  )
}
