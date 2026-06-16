import { Jogo } from "@/types/jogo";
import { useAuth } from "./use-auth";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/lib/env";


export function useJogosHoje() {
    const { token } = useAuth()

    return useQuery<Jogo[]>({
        queryKey: ['jogos', 'hoje'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/jogos/hoje`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            if (!res.ok) throw new Error('Erro ao buscar jogos de hoje');
            return res.json()
        },
        enabled: !!token,
        staleTime: 10 * 60 * 1000,
    })
}