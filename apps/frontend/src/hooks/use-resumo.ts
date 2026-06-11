import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { API_URL } from '@/lib/env'
import { Resumo } from '@/types/usuario'


export function useResumo() {
  const { token } = useAuth()

  return useQuery<Resumo>({
    queryKey: ['resumo'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/auth/me/resumo`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao buscar resumo')
      return res.json()
    },
    enabled: !!token,
    staleTime: 1 * 60 * 1000,
  })
}