import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'
import type { ComunidadeListaResponse, ComunidadeResponse } from '@/types/comunidade'

export function useComunidades() {
  const { token } = useAuth()

  return useQuery<ComunidadeListaResponse[]>({
    queryKey: ['comunidades'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/comunidades`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao buscar comunidades')
      return res.json()
    },
    enabled: !!token,
    staleTime: 1 * 60 * 1000,
  })
}