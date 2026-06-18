import { useQuery } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { API_URL } from '@/lib/env'

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
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin/push/assinantes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao buscar assinantes')
      return res.json()
    },
    enabled: !!token,
    staleTime: 60 * 1000,
  })
}
