import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'
import type { DetalhesComunidade } from '@/types/comunidade'

export function useComunidadeDetalhes(comunidadeId: string | null) {
  const { token } = useAuth()

  return useQuery<DetalhesComunidade>({
    queryKey: ['comunidades', comunidadeId, 'detalhes'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao buscar detalhes da comunidade')
      return res.json()
    },
    enabled: !!token && !!comunidadeId,
    staleTime: 1 * 60 * 1000,
    retry: false,
    throwOnError: false,
  })
}