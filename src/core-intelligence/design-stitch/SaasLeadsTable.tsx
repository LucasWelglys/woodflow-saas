import { Lock, Edit3, Trash2, Users, UserPlus, TrendingUp } from 'lucide-react'

interface Lead {
  id: string
  nome: string
  nome_dono?: string
  email_contato: string | null
  whatsapp: string | null
  status_conta: string
  plano_atual: string
  created_at: string
  updated_at: string
}

interface LeadsTableProps {
  data: Lead[]
  onApprove: (id: string) => void
  onBlock: (id: string) => void
  onManage: (lead: Lead) => void
}

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { bg: string, text: string, label: string }> = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'ATIVO' },
    inactive: { bg: 'bg-red-50', text: 'text-red-500', label: 'INATIVO' },
    PENDING_APPROVAL: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'PENDENTE' },
    blocked: { bg: 'bg-red-50', text: 'text-red-500', label: 'BLOQUEADO' },
    past_due: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'EXPIRADO' }
  }

  const config = configs[status] || configs['PENDING_APPROVAL']

  return (
    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${config.bg} ${config.text} border-none uppercase tracking-wider`}>
      {config.label}
    </span>
  )
}

export function SaasLeadsTable({ data, onApprove, onBlock, onManage }: LeadsTableProps) {
  return (
    <div className="bg-white border border-stone-100 rounded-[24px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-50 bg-stone-50/30">
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-left">Nome do Cliente</th>
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-left">E-mail</th>
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-left">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-left">Plano</th>
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-left">Data de Cadastro</th>
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-left">Última Atividade</th>
              <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-stone-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs shadow-sm">
                      {item.nome_dono?.substring(0, 2).toUpperCase() || item.nome?.substring(0, 2).toUpperCase() || 'WT'}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-stone-900 leading-none">{item.nome}</span>
                      <span className="text-[10px] font-medium text-blue-600/60 uppercase tracking-tighter">Prop: {item.nome_dono}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs text-stone-500 font-medium">{item.email_contato || 'N/A'}</span>
                </td>
                <td className="px-8 py-6">
                  <StatusBadge status={item.status_conta} />
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs font-bold text-stone-600">{item.plano_atual}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs text-stone-500 font-medium">
                    {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-xs text-stone-500 font-medium">
                    {new Date(item.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onBlock(item.id)} className="p-2 hover:bg-stone-50 rounded-lg transition-colors text-stone-400 hover:text-red-500 border border-transparent hover:border-stone-200 shadow-sm">
                      <Lock size={16} />
                    </button>
                    <button onClick={() => onManage(item)} className="p-2 hover:bg-stone-50 rounded-lg transition-colors text-stone-400 hover:text-blue-500 border border-transparent hover:border-stone-200 shadow-sm">
                      <Edit3 size={16} />
                    </button>
                    <button className="p-2 hover:bg-stone-50 rounded-lg transition-colors text-stone-400 hover:text-red-600 border border-transparent hover:border-stone-200 shadow-sm">
                      <Trash2 size={16} />
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
