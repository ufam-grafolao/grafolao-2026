import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'
import type { SolicitacaoResponse } from '@/types/comunidade'

export function useSolicitacoes(comunidadeId: string | null) {
  const { token } = useAuth()

  return useQuery<SolicitacaoResponse[]>({
    queryKey: ['comunidades', comunidadeId, 'solicitacoes'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/comunidades/${comunidadeId}/solicitacoes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao buscar solicitações')
      return res.json()
    },
    enabled: !!token && !!comunidadeId,
    staleTime: 30 * 1000,
  })
}