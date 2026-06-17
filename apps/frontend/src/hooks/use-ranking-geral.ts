import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'
import type { RankingGeralResponse } from '@/types/ranking'

export function useRankingGeral(page: number, limit = 20) {
  const { token } = useAuth()

  return useQuery<RankingGeralResponse>({
    queryKey: ['ranking', 'geral', page, limit],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/ranking/geral?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao buscar ranking')
      return res.json()
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  })
}
