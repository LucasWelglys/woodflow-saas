'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import { Hammer } from 'lucide-react'

export default function PDFPage() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchPdfData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch Pedido com Cliente
      const { data: order } = await supabase
        .from('pedidos')
        .select('*, clientes(*)')
        .eq('id', id)
        .single()
      
      if (!order) return

      // Fetch Marcenaria
      const { data: marcenaria } = await supabase
        .from('marcenarias')
        .select('*')
        .eq('id', order.marcenaria_id)
        .single()

      // Fetch Parcelas
      const { data: parcelas } = await supabase
        .from('parcelas')
        .select('*')
        .eq('pedido_id', id)
        .order('numero_parcela', { ascending: true })

      setData({
        order,
        cliente: order.clientes,
        marcenaria,
        parcelas: parcelas || []
      })
      
      // Delay printing to allow fonts/images to load safely
      setTimeout(() => {
        window.print()
      }, 500)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  useEffect(() => {
    fetchPdfData()
  }, [fetchPdfData])

  if (loading) return <div className="p-8 font-bold text-center text-stone-400">Preparando documento...</div>
  if (!data) return <div className="p-8 font-bold text-center text-red-500">Erro ao carregar documento.</div>

  const { order, cliente, marcenaria, parcelas } = data
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  // Validade de 10 dias após a criação do pedido
  const dataValidade = new Date(order.created_at)
  dataValidade.setDate(dataValidade.getDate() + 10)

  return (
    <div className="bg-white min-h-screen font-sans text-stone-800 printable-a4">
      {/* Container A4 formatado (máx. estabilidade CSS para impressão) */}
      <div className="max-w-[210mm] mx-auto p-8 md:p-12 print:p-0">
        
        {/* Header Profissional */}
        <header className="flex justify-between items-start border-b-2 border-stone-800 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-wood-dark p-3 rounded-lg print:bg-stone-800 print:text-white">
              <Hammer className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-wood-dark print:text-stone-900 uppercase tracking-tighter">
                {marcenaria?.nome || 'Marcenaria WoodFlow'}
              </h1>
              <p className="text-xs font-bold text-stone-500">Orçamento Oficial</p>
              <p className="text-[10px] text-stone-400 mt-1">{marcenaria?.email_contato}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black text-stone-200 print:text-stone-300">
              #{order.numero.toString().padStart(4, '0')}
            </h2>
            <p className="text-xs font-bold mt-1 text-stone-400 uppercase tracking-widest">
              Emissão: {new Date(order.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </header>

        {/* Cliente & Validade */}
        <div className="grid grid-cols-2 gap-8 mb-8 bg-stone-50 p-6 rounded-xl print:bg-stone-50 print:border print:border-stone-200">
          <div>
            <h3 className="text-[10px] uppercase font-black tracking-widest text-stone-400 mb-2">Dados do Cliente</h3>
            <p className="font-bold text-sm text-stone-800">{cliente?.nome || 'N/A'}</p>
            {cliente?.cpf_cnpj && <p className="text-xs text-stone-500">CPF/CNPJ: {cliente.cpf_cnpj}</p>}
            {cliente?.telefone && <p className="text-xs text-stone-500">Telefone: {cliente.telefone}</p>}
            {cliente?.endereco && <p className="text-xs text-stone-500 line-clamp-2">Endereço: {cliente.endereco}</p>}
          </div>
          <div className="text-right">
             <h3 className="text-[10px] uppercase font-black tracking-widest text-stone-400 mb-2">Atenção</h3>
             <div className="inline-block bg-wood-dark text-white px-4 py-2 rounded-lg print:bg-stone-100 print:text-stone-800 print:border print:border-stone-300">
                <p className="text-[10px] font-bold uppercase tracking-widest">Validade do Orçamento</p>
                <p className="text-sm font-black">{dataValidade.toLocaleDateString('pt-BR')} (10 dias)</p>
             </div>
          </div>
        </div>

        {/* Escopo do Projeto */}
        <section className="mb-10 min-h-[150px]">
          <h3 className="text-sm font-black uppercase tracking-widest text-wood-dark border-b border-stone-200 pb-2 mb-4">
            Escopo do Projeto
          </h3>
          <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed font-medium">
            {order.descricao || 'Nenhuma descrição fornecida para este projeto.'}
          </p>
        </section>

        {/* Resumo Financeiro */}
        <section className="mb-12">
          <h3 className="text-sm font-black uppercase tracking-widest text-wood-dark border-b border-stone-200 pb-2 mb-4">
            Investimento & Condições de Pagamento
          </h3>
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase text-stone-400">Valor Total do Projeto</p>
            <p className="text-3xl font-black text-stone-900">{fmt(order.valor_total)}</p>
          </div>
          
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-800 text-stone-500">
                <th className="py-2 font-bold text-[10px] uppercase tracking-widest">Parcela</th>
                <th className="py-2 font-bold text-[10px] uppercase tracking-widest">Vencimento</th>
                <th className="py-2 font-bold text-[10px] uppercase tracking-widest">Modalidade</th>
                <th className="py-2 font-bold text-[10px] uppercase tracking-widest text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium">
              {parcelas.map((p: any) => (
                <tr key={p.id}>
                  <td className="py-3 text-stone-500">{p.numero_parcela}º Pagamento</td>
                  <td className="py-3">{new Date(p.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC'})}</td>
                  <td className="py-3 uppercase text-xs">{p.modalidade}</td>
                  <td className="py-3 text-right font-bold">{fmt(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Assinaturas */}
        <section className="mt-24 pt-12 grid grid-cols-2 gap-12 text-center break-inside-avoid">
          <div>
            <div className="h-px bg-stone-300 w-full mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500">{marcenaria?.nome || 'A Marcenaria'}</p>
            <p className="text-[10px] text-stone-400">Contratada</p>
          </div>
          <div>
            <div className="h-px bg-stone-300 w-full mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500">{cliente?.nome || 'Cliente'}</p>
            <p className="text-[10px] text-stone-400">Contratante</p>
          </div>
        </section>

        {/* Termos de Rodapé */}
        <footer className="mt-16 text-center opacity-60">
           <p className="text-[9px] font-medium text-stone-500 uppercase tracking-widest">
             Este documento consolida o escopo e os valores acordados entre as partes. Documento gerado pelo sistema WoodFlow.
           </p>
        </footer>

      </div>
    </div>
  )
}
