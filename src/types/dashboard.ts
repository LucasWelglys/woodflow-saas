export interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
  cpf?: string
  cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  uf?: string
}

export interface Parcel {
  id: string
  pedido_id: string
  marcenaria_id: string
  numero_parcela: number
  valor: number
  data_vencimento: string
  modalidade: string
  status: string
}

export interface Order {
  id: string
  numero: number
  descricao: string
  valor_total: number
  status: string
  cliente_id: string
  marcenaria_id: string
  created_at: string
  cliente_nome: string // Nome denormalizado para facilidade no frontend
  clientes?: {
    nome: string
  }
}

export interface DashboardData {
  summary: {
    bruto: number
    recebido: number
    aReceber: number
    vencido: number
  }
  orders: Order[]
}
