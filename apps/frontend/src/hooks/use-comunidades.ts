import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { apiFetch } from '@/lib/api-client'
import type { ComunidadeListaResponse } from '@/types/comunidade'

export function useComunidades() {
  const { token } = useAuth()

  return useQuery<ComunidadeListaResponse[]>({
    queryKey: ['comunidades'],
    queryFn: () => apiFetch<ComunidadeListaResponse[]>('/comunidades'),
    enabled: !!token,
    staleTime: 1 * 60 * 1000,
  })
}
