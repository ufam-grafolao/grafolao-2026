import { Jogo } from "@/types/jogo";
import { useAuth } from "./use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";


export function useJogosHoje() {
    const { token } = useAuth()

    return useQuery<Jogo[]>({
        queryKey: ['jogos', 'hoje'],
        queryFn: () => apiFetch<Jogo[]>('/jogos/hoje'),
        enabled: !!token,
        staleTime: 10 * 60 * 1000,
    })
}