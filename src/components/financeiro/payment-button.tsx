'use client'

import { useState } from 'react'
import { marcarComoPago } from '@/app/actions/financeiro'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaymentButtonProps {
  parcelaId: string
  className?: string
}

export function PaymentButton({ parcelaId, className }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handlePayment = async () => {
    if (!confirm('Deseja marcar esta parcela como PAGA?')) return
    
    setLoading(true)
    try {
      await marcarComoPago(parcelaId)
      router.refresh()
    } catch (error) {
      alert('Erro ao processar pagamento: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 bg-caixa-verde text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${className}`}
    >
      {loading ? (
        <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Check className="h-3 w-3" />
      )}
      {loading ? 'Processando...' : 'Dar Baixa'}
    </button>
  )
}
