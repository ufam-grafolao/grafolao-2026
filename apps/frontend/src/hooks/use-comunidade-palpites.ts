import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { apiFetch } from '@/lib/api-client'

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
    queryFn: () => apiFetch<JogoComPalpites[]>(`/comunidades/${comunidadeId}/palpites`),
    enabled: !!token && !!comunidadeId,
    staleTime: 2 * 60 * 1000,
  })
}
