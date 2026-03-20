import { z } from 'zod'

export const ParcelaSchema = z.object({
  valor: z.number().positive('Valor da parcela deve ser maior que zero'),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)'),
  modalidade: z.enum(['dinheiro', 'pix', 'cheque', 'cartao_debito', 'cartao_credito', 'boleto']),
  status: z.enum(['pendente', 'pago']).default('pendente'),
  // Campos opcionais de cartão/taxa
  taxa_cartao: z.number().min(0).optional(),
  valor_liquido: z.number().min(0).optional(),
  data_bom_para: z.string().optional()
})

export const CreatePedidoSchema = z.object({
  cliente_id: z.string().uuid('ID de cliente inválido'),
  descricao: z.string().min(3, 'A descrição deve ter no mínimo 3 caracteres'),
  valor_total: z.number().positive('O valor total deve ser positivo')
})

export const UpdatePedidoSchema = CreatePedidoSchema

export const PedidoParcelasInputSchema = z.object({
  pedidoId: z.string().uuid().optional(),
  data: UpdatePedidoSchema,
  parcelasData: z.array(ParcelaSchema).min(1, 'No mínimo uma parcela é requerida.')
}).superRefine((data, ctx) => {
  const somaParcelas = data.parcelasData.reduce((acc, p) => acc + p.valor, 0)
  // Margem de erro para arredondamento
  if (Math.abs(somaParcelas - data.data.valor_total) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `A soma das parcelas (R$ ${somaParcelas.toFixed(2)}) difere do valor total (R$ ${data.data.valor_total.toFixed(2)}).`,
      path: ['parcelasData']
    })
  }
})
