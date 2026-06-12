import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'
import type { Jogo } from '@/types/jogo'

interface JogosParams {
  fase?: string
  grupo?: string
  rodada?: string
  status?: string
}

export function useJogos(params: JogosParams = {}) {
  const { token } = useAuth()

  const query = new URLSearchParams()
  if (params.fase)   query.set('fase',   params.fase)
  if (params.grupo)  query.set('grupo',  params.grupo)
  if (params.rodada) query.set('rodada', params.rodada)
  if (params.status) query.set('status', params.status)

  return useQuery<Jogo[]>({
    queryKey: ['jogos', params],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/jogos?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao buscar jogos');
      return res.json()
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  })
}