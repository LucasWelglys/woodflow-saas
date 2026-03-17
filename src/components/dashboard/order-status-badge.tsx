'use client'

interface OrderStatusBadgeProps {
  status: string
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const styles: Record<string, string> = {
    orcamento: 'bg-stone-100 text-stone-600 border-stone-200',
    producao: 'bg-amber-50 text-amber-700 border-amber-200',
    entregue: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelado: 'bg-red-50 text-red-700 border-red-200'
  }

  const labels: Record<string, string> = {
    orcamento: 'Orçamento',
    producao: 'Em Produção',
    entregue: 'Finalizado',
    cancelado: 'Cancelado'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${styles[status] || styles.orcamento}`}>
      {labels[status] || status}
    </span>
  )
}
