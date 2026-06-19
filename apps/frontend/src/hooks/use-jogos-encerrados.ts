import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { apiFetch } from '@/lib/api-client'
import { JogoPendente } from '@/types/jogo'

export function useJogosEncerrados() {
  const { token } = useAuth()

  return useQuery<JogoPendente[]>({
    queryKey: ['admin', 'jogos', 'encerrados'],
    queryFn: () => apiFetch<JogoPendente[]>('/jogos?status=ENCERRADO'),
    enabled: !!token,
    staleTime: 30 * 1000,
  })
}
