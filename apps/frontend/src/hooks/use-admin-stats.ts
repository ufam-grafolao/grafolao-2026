import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { apiFetch } from '@/lib/api-client'

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
    queryFn: () => apiFetch<AdminStats>('/admin/stats'),
    enabled: !!token,
    staleTime: 60 * 1000,
  })
}
