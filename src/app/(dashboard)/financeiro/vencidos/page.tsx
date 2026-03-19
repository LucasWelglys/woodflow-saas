import { createClient } from '@/lib/supabase-server'
import { getMarcenariaContext } from '@/lib/marcenaria'
import { PaymentButton } from '@/components/financeiro/payment-button'
import { AlertCircle, ChevronLeft, Phone } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function VencidosPage() {
  const supabase = createClient()
  const marcenaria = await getMarcenariaContext()
  
  if (!marcenaria) {
    redirect('/login')
  }

  const { data: vencidos, error } = await supabase
    .from('v_boletos_vencidos')
    .select('*')
    .eq('marcenaria_id', marcenaria.id)
    .order('dias_atraso', { ascending: false })

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/dashboard/financeiro" 
          className="flex items-center gap-2 text-stone-400 hover:text-wood-dark transition-colors font-bold text-sm group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Voltar para Financeiro
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-wood-dark tracking-tighter flex items-center gap-3">
              <AlertCircle className="h-10 w-10 text-erro-vermelho" />
              Parcelas Vencidas
            </h2>
            <p className="text-stone-500 mt-1 font-medium">Listagem total de atrasos para cobrança manual.</p>
          </div>
          <div className="bg-erro-vermelho/5 px-6 py-4 rounded-2xl border border-erro-vermelho/10">
            <p className="text-[10px] font-black text-erro-vermelho uppercase tracking-widest">Total em Atraso</p>
            <p className="text-2xl font-black text-erro-vermelho">
              {fmt(vencidos?.reduce((acc, curr) => acc + curr.valor, 0) || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Dias Atraso</th>
                <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Cliente / Projeto</th>
                <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Valor</th>
                <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {vencidos?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-stone-400 text-sm font-medium italic">
                    Nenhuma parcela vencida encontrada. Ótimo trabalho!
                  </td>
                </tr>
              ) : (
                vencidos?.map((v) => (
                  <tr key={v.parcela_id} className="group hover:bg-stone-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center px-3 py-1 bg-erro-vermelho/10 text-erro-vermelho rounded-full text-xs font-black">
                        {v.dias_atraso} DIAS
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-wood-dark">{v.cliente_nome}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-stone-400 font-bold uppercase">PEDIDO #{v.pedido_numero}</span>
                          {v.cliente_telefone && (
                            <a 
                              href={`https://wa.me/${v.cliente_telefone.replace(/\D/g, '')}`} 
                              target="_blank"
                              className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 hover:underline"
                            >
                              <Phone className="h-2.5 w-2.5" />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-sm font-black text-wood-dark">{fmt(v.valor)}</span>
                      <div className="text-[10px] text-stone-400 font-bold uppercase">{v.modalidade}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                         <PaymentButton parcelaId={v.parcela_id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
