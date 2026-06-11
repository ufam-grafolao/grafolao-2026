import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { API_URL } from '@/lib/env'
import { JogoPendente } from '@/types/jogo'

export function useJogosEncerrados() {
  const { token } = useAuth()

  return useQuery<JogoPendente[]>({
    queryKey: ['admin', 'jogos', 'encerrados'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/jogos?status=ENCERRADO`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao buscar jogos encerrados')
      return res.json()
    },
    enabled: !!token,
    staleTime: 30 * 1000,
  })
}