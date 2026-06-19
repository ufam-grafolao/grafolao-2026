import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { apiFetch } from '@/lib/api-client'
import type { RankingMembro } from '@/types/comunidade'

export function useRankingComunidade(comunidadeId: string | null) {
  const { token } = useAuth()

  return useQuery<RankingMembro[]>({
    queryKey: ['comunidades', comunidadeId, 'ranking'],
    queryFn: () => apiFetch<RankingMembro[]>(`/comunidades/${comunidadeId}/ranking`),
    enabled: !!token && !!comunidadeId,
    staleTime: 2 * 60 * 1000,
  })
}
