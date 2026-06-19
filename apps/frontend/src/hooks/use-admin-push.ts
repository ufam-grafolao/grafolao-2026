import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { apiFetch } from '@/lib/api-client'

export interface AssinanteNotificacao {
  subscriptionId: string
  criadoEm: string
  usuario: {
    id: string
    nome: string
    email: string
    avatarUrl: string | null
  }
}

export interface AdminPushData {
  total: number
  assinantes: AssinanteNotificacao[]
}

export function useAdminPush() {
  const { token } = useAuth()

  return useQuery<AdminPushData>({
    queryKey: ['admin', 'push', 'assinantes'],
    queryFn: () => apiFetch<AdminPushData>('/admin/push/assinantes'),
    enabled: !!token,
    staleTime: 60 * 1000,
  })
}
