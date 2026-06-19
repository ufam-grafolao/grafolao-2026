import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { apiFetch } from '@/lib/api-client'
import { Resumo } from '@/types/usuario'

export function useResumo() {
  const { token } = useAuth()

  return useQuery<Resumo>({
    queryKey: ['resumo'],
    queryFn: () => apiFetch<Resumo>('/auth/me/resumo'),
    enabled: !!token,
    staleTime: 1 * 60 * 1000,
  })
}
