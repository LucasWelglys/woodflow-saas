import { MoreHorizontal, ExternalLink, ShieldCheck, ShieldAlert, Clock } from 'lucide-react'

interface Marcenaria {
  id: string
  nome: string
  whatsapp: string
  status_conta: string
  plano_atual: string
  created_at: string
}

interface LeadsTableProps {
  data: Marcenaria[]
  onApprove: (id: string) => void
  onBlock: (id: string) => void
  onManage: (marcenaria: Marcenaria) => void
}

export function SaasLeadsTable({ data, onApprove, onBlock, onManage }: LeadsTableProps) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-900/50">
              <th className="px-6 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest">Marcenaria</th>
              <th className="px-6 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest">Contato</th>
              <th className="px-6 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest">Plano</th>
              <th className="px-6 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest">Cadastro</th>
              <th className="px-6 py-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/50">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-stone-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-wood-dark flex items-center justify-center border border-stone-700 font-bold text-stone-100 uppercase transition-all group-hover:border-amber-500/50">
                      {item.nome?.charAt(0) || 'M'}
                    </div>
                    <span className="text-sm font-bold text-stone-200">{item.nome}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-stone-400 font-medium">{item.whatsapp || 'Não informado'}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status_conta} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black text-stone-400 bg-stone-800 px-2 py-1 rounded-md uppercase tracking-wider border border-stone-700">
                    {item.plano_atual}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-stone-500 font-medium">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {item.status_conta === 'PENDING_APPROVAL' && (
                      <button 
                        onClick={() => onApprove(item.id)}
                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                        title="Aprovar"
                      >
                        <ShieldCheck size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => onManage(item)}
                      className="p-2 bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-100 rounded-lg transition-all"
                      title="Detalhes"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button 
                      onClick={() => onBlock(item.id)}
                      className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                      title="Bloquear"
                    >
                      <ShieldAlert size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string, color: string, icon: any }> = {
    active: { label: 'Ativo', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: ShieldCheck },
    PENDING_APPROVAL: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
    blocked: { label: 'Bloqueado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: ShieldAlert },
    trial: { label: 'Trial', color: 'bg-stone-700 text-stone-300 border-stone-600', icon: Clock },
  }

  const config = configs[status] || { label: status, color: 'bg-stone-800 text-stone-400 border-stone-700', icon: MoreHorizontal }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.color}`}>
      <config.icon size={10} strokeWidth={3} />
      {config.label}
    </div>
  )
}
