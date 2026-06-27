import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import { JogadorBusca } from '@/types/jogadores'

export function useBuscarJogadores(termo: string) {
  return useQuery({
    queryKey: ['jogadores-busca', termo],
    queryFn: () => apiFetch<JogadorBusca[]>(`/jogadores/buscar?q=${encodeURIComponent(termo)}`),
    enabled: termo.trim().length >= 2,
  })
}