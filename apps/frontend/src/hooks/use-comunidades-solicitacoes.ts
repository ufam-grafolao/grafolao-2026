import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { apiFetch } from '@/lib/api-client'
import type { SolicitacaoResponse } from '@/types/comunidade'

export function useSolicitacoes(comunidadeId: string | null) {
  const { token } = useAuth()

  return useQuery<SolicitacaoResponse[]>({
    queryKey: ['comunidades', comunidadeId, 'solicitacoes'],
    queryFn: () => apiFetch<SolicitacaoResponse[]>(`/comunidades/${comunidadeId}/solicitacoes`),
    enabled: !!token && !!comunidadeId,
    staleTime: 30 * 1000,
  })
}
