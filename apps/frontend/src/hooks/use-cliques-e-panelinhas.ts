import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { CliquesQueryParams, CliquesResponse } from '@/types/cliques-e-panelinhas'

function montarQueryString(params: CliquesQueryParams) {
  const query = new URLSearchParams()

  if (params.ordem) query.set('ordem', params.ordem)
  if (typeof params.minimoUsuarios === 'number' && params.minimoUsuarios >= 0) {
    query.set('minimoUsuarios', String(params.minimoUsuarios))
  }
  if (typeof params.minimoJogos === 'number' && params.minimoJogos >= 0) {
    query.set('minimoJogos', String(params.minimoJogos))
  }
  if (params.comigo) query.set('comigo', 'true')
  if (params.comJogo?.trim()) query.set('comJogo', params.comJogo.trim())

  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export function useCliquesEPanelinhas(params: CliquesQueryParams) {
  return useQuery({
    queryKey: ['cliques-e-panelinhas', params.ordem, params.minimoUsuarios, params.minimoJogos, params.comigo, params.comJogo],
    queryFn: () => apiFetch<CliquesResponse>(`/cliques${montarQueryString(params)}`),
    staleTime: 5 * 60 * 1000,
  })
}