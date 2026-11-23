import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { PanelinhasResponse, PontoSeriePanelinhas } from '@/types/grafo-panelinhas'

export interface FiltrosPanelinhas {
  minPalpites: number
  percentil: number
  /** fração (0–1) de quem palpitou; jogos acertados por mais que isso saem. undefined = sem filtro */
  excluirAcimaDe?: number
}

const K = 5

function parametros({ minPalpites, percentil, excluirAcimaDe }: FiltrosPanelinhas) {
  const q = new URLSearchParams({ minPalpites: String(minPalpites), percentil: String(percentil), k: String(K) })
  if (excluirAcimaDe !== undefined) q.set('excluirAcimaDe', String(excluirAcimaDe))
  return q.toString()
}

export function usePanelinhas(filtros: FiltrosPanelinhas) {
  return useQuery({
    queryKey: ['panelinhas', filtros],
    queryFn: () => apiFetch<PanelinhasResponse>(`/grafos/panelinhas?${parametros(filtros)}`),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSeriePanelinhas(filtros: FiltrosPanelinhas) {
  return useQuery({
    queryKey: ['panelinhas-serie', filtros],
    queryFn: () => apiFetch<PontoSeriePanelinhas[]>(`/grafos/panelinhas/serie?${parametros(filtros)}`),
    staleTime: 5 * 60 * 1000,
    throwOnError: false, // a série falha sozinha, sem derrubar o grafo acima

  })
}
