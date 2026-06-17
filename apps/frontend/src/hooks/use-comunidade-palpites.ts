import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { API_URL } from '@/lib/env'

export interface PalpiteMembro {
  usuarioId: string
  nome: string
  avatarUrl: string | null
  golsCasa: number | null
  golsVisitante: number | null
  pontos: number | null
  status: 'ACERTO_PLACAR' | 'ACERTO_VENCEDOR' | 'ERRO' | 'PENDENTE' | null
}

export interface JogoComPalpites {
  jogoId: string
  dataHora: string
  rodada: string
  grupo: string | null
  timeCasaRef: string | null
  timeVisitanteRef: string | null
  timeCasa: { nome: string } | null
  timeVisitante: { nome: string } | null
  resultado: { golsCasa: number; golsVisitante: number } | null
  palpites: PalpiteMembro[]
}

export function useComunidadePalpites(comunidadeId: string | null) {
  const { token } = useAuth()

  return useQuery<JogoComPalpites[]>({
    queryKey: ['comunidades', comunidadeId, 'palpites'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}/palpites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao buscar palpites')
      return res.json()
    },
    enabled: !!token && !!comunidadeId,
    staleTime: 2 * 60 * 1000,
  })
}
