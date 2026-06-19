import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { apiFetch } from '@/lib/api-client'
import { JogoPendente } from '@/types/jogo'

export function useJogosPendentes() {
  const { token } = useAuth()

  return useQuery<JogoPendente[]>({
    queryKey: ['admin', 'jogos', 'pendentes'],
    queryFn: () => apiFetch<JogoPendente[]>('/admin/jogos/pendentes'),
    enabled: !!token,
    staleTime: 30 * 1000,
  })
}
