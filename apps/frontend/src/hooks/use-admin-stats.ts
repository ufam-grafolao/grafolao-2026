import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { API_URL } from '@/lib/env'

export interface PalpitesPorUsuario {
  usuarioId: string
  nome: string
  email: string
  avatarUrl: string | null
  palpites: number
  especiais: number
  total: number
}

export interface AdminStats {
  totalUsuarios: number
  totalPalpites: number
  totalEspeciais: number
  palpitesPorUsuario: PalpitesPorUsuario[]
}

export function useAdminStats() {
  const { token } = useAuth()

  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao buscar estatísticas')
      return res.json()
    },
    enabled: !!token,
    staleTime: 60 * 1000,
  })
}
