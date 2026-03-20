import { z } from 'zod'

export const CustoProjetoSchema = z.object({
  pedido_id: z.string().uuid('ID de pedido inválido'),
  categoria: z.enum(['material', 'mao_de_obra', 'terceirizado', 'frete', 'outro']),
  descricao: z.string().min(3, 'Descrição muito curta'),
  valor: z.number().positive('O custo deve ser maior que zero')
})

export const DespesaGlobalSchema = z.object({
  categoria: z.string().min(2, 'Categoria inválida'),
  descricao: z.string().min(3, 'A descrição deve ter no mínimo 3 caracteres'),
  valor: z.number().positive('A despesa deve ser maior que zero'),
  data_pagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido'),
  recorrente: z.boolean().default(false)
})
