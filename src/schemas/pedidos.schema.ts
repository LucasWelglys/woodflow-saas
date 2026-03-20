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
  const somaCentavosParcelas = data.parcelasData.reduce((acc, p) => acc + Math.round(p.valor * 100), 0)
  const totalCentavos = Math.round(data.data.valor_total * 100)
  
  // Margem de erro estrita para 1 centavo (para lidar com dízimas periódicas)
  if (Math.abs(somaCentavosParcelas - totalCentavos) > 1) {
    const somaReais = somaCentavosParcelas / 100
    const totalReais = totalCentavos / 100
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `A soma das parcelas (R$ ${somaReais.toFixed(2).replace('.', ',')}) não corresponde ao total (R$ ${totalReais.toFixed(2).replace('.', ',')}). Verifique os centavos.`,
      path: ['parcelasData']
    })
  }
})
