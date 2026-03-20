// src/lib/evolution.ts

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const DEFAULT_INSTANCE = 'woodflow'

/**
 * Interface base para resposta da Evolution API
 */
interface EvolutionResponse {
  status: number
  message?: string
  data?: any
}

/**
 * Classe de serviço para comunicação com a Evolution API
 * Preparada para a Fase 5 de automações e alertas de produção.
 */
export class EvolutionService {
  
  /**
   * Verifica se a API da Evolution está online e conectada
   */
  static async checkConnection(): Promise<boolean> {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.warn('Variáveis de ambiente EVOLUTION_API não configuradas.')
      return false
    }

    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${DEFAULT_INSTANCE}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      })
      
      if (!response.ok) return false
      
      const data = await response.json()
      return data?.instance?.state === 'open'
    } catch (error) {
      console.error('Erro ao conectar na Evolution API:', error)
      return false
    }
  }

  /**
   * Envia uma mensagem de texto simples
   */
  static async sendTextMessage(phone: string, text: string): Promise<EvolutionResponse> {
    try {
      // Limpa formatação do telefone
      const cleanPhone = phone.replace(/\D/g, '')
      
      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${DEFAULT_INSTANCE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: cleanPhone,
          options: {
            delay: 1200,
            presence: 'composing'
          },
          textMessage: {
            text
          }
        })
      })

      return {
        status: response.status,
        data: await response.json()
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error)
      return {
        status: 500,
        message: error.message
      }
    }
  }
}
