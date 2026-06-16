import { API_URL } from "@/lib/env"
import { Usuario } from "@/types/usuario"
import { useQuery } from "@tanstack/react-query"

export function useAuthMe(token: string | null) {
    return useQuery<Usuario>({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            if (!token) throw new Error('Token ausente')

            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!res.ok) throw new Error('Falha ao obter dados do usuário');
            return res.json()
        },
        enabled: !!token,
        staleTime: 5 * 60 * 1000,
    })

}