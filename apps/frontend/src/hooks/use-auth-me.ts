import { Usuario } from "@/types/usuario"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from '@/lib/api-client'

export function useAuthMe(token: string | null) {
    return useQuery<Usuario>({
        queryKey: ['auth', 'me'],
        queryFn: () => apiFetch<Usuario>('/auth/me', {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }),
        enabled: !!token,
        staleTime: 5 * 60 * 1000,
    })
}
