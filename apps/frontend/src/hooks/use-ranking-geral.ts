import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { apiFetch } from '@/lib/api-client'
import type { RankingGeralResponse } from '@/types/ranking'

export function useRankingGeral(page: number, limit = 20, sortBy: 'pontos' | 'acertos' = 'pontos') {
  const { token } = useAuth()

  return useQuery<RankingGeralResponse>({
    queryKey: ['ranking', 'geral', page, limit, sortBy],
    queryFn: () => apiFetch<RankingGeralResponse>(`/ranking/geral?page=${page}&limit=${limit}&sortBy=${sortBy}`),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  })
}
