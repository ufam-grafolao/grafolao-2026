import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type {
  GrafoConfrontosResponse,
  CicloResponse,
  CaminhoMaisLongoResponse,
} from '@/types/grafo-confrontos'

export function useGrafoConfrontos(minPalpites: number) {
  return useQuery({
    queryKey: ['grafo-confrontos', minPalpites],
    queryFn: () =>
      apiFetch<GrafoConfrontosResponse>(
        `/grafos/confrontos${minPalpites > 0 ? `?minPalpites=${minPalpites}` : ''}`
      ),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCiclosConfrontos(minPalpites: number) {
  return useQuery({
    queryKey: ['ciclos-confrontos', minPalpites],
    queryFn: () =>
      apiFetch<CicloResponse[]>(
        `/grafos/confrontos/ciclos${minPalpites > 0 ? `?minPalpites=${minPalpites}` : ''}`
      ),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCaminhoMaisLongo() {
  return useMutation({
    mutationFn: ({ minPalpites, orcamentoMs }: { minPalpites: number; orcamentoMs: number }) =>
      apiFetch<CaminhoMaisLongoResponse>(
        `/grafos/confrontos/caminho-mais-longo?orcamentoMs=${orcamentoMs}${
          minPalpites > 0 ? `&minPalpites=${minPalpites}` : ''
        }`
      ),
  })
}