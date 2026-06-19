import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { apiFetch } from '@/lib/api-client'
import type { DetalhesComunidade } from '@/types/comunidade'

export function useComunidadeDetalhes(comunidadeId: string | null) {
  const { token } = useAuth()

  return useQuery<DetalhesComunidade>({
    queryKey: ['comunidades', comunidadeId, 'detalhes'],
    queryFn: () => apiFetch<DetalhesComunidade>(`/comunidades/${comunidadeId}`),
    enabled: !!token && !!comunidadeId,
    staleTime: 1 * 60 * 1000,
    retry: false,
    throwOnError: false,
  })
}
