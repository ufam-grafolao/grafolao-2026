import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'
import type { RankingMembro } from '@/types/comunidade'

export function useRankingComunidade(comunidadeId: string | null) {
  const { token } = useAuth()

  return useQuery<RankingMembro[]>({
    queryKey: ['comunidades', comunidadeId, 'ranking'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}/ranking`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao buscar ranking')
      return res.json()
    },
    enabled: !!token && !!comunidadeId,
    staleTime: 2 * 60 * 1000,
  })
}