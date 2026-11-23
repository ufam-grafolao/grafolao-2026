import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type {
  DetalheJogoZebraResponse,
  MetricaOusadia,
  MstAgregadaResponse,
  RankingZebraResponse,
} from '@/types/grafo-zebra'

// O ranking é sempre pela média por jogo (ordenarPor=media), o padrão do backend.
export function useRankingZebra(minPalpites: number, ousadia: MetricaOusadia) {
  return useQuery({
    queryKey: ['zebra-ranking', minPalpites, ousadia],
    queryFn: () =>
      apiFetch<RankingZebraResponse>(
        `/grafos/zebra/ranking?minPalpites=${minPalpites}&ousadia=${ousadia}&ordenarPor=media`
      ),
    staleTime: 5 * 60 * 1000,
  })
}

export function useMstZebra(minPalpites: number) {
  return useQuery({
    queryKey: ['zebra-mst', minPalpites],
    queryFn: () => apiFetch<MstAgregadaResponse>(`/grafos/zebra/mst?minPalpites=${minPalpites}`),
    staleTime: 5 * 60 * 1000,
  })
}

export function useJogoZebra(jogoId: string | null, ousadia: MetricaOusadia) {
  return useQuery({
    queryKey: ['zebra-jogo', jogoId, ousadia],
    queryFn: () =>
      apiFetch<DetalheJogoZebraResponse>(`/grafos/zebra/jogos/${encodeURIComponent(jogoId!)}?ousadia=${ousadia}`),
    enabled: !!jogoId,
    staleTime: 5 * 60 * 1000,
    throwOnError: false, // 404 (jogo não encerrado) e falhas ficam dentro da seção do jogo

  })
}
