import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type {
  PalpiteEspecialResponse,
  SalvarPalpiteEspecialBody,
  ResultadoEspecialResponse,
} from '@/types/palpites-especiais'

export function useMeusPalpitesEspeciais() {
  return useQuery({
    queryKey: ['palpites-especiais', 'meus'],
    queryFn: () => apiFetch<PalpiteEspecialResponse[]>('/palpites-especiais/meus'),
  })
}

export function useResultadosEspeciais() {
  return useQuery({
    queryKey: ['palpites-especiais', 'resultados'],
    queryFn: () => apiFetch<ResultadoEspecialResponse[]>('/palpites-especiais/resultados'),
    staleTime: 60 * 1000,
  })
}

export function useSalvarPalpiteEspecial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SalvarPalpiteEspecialBody) =>
      apiFetch<PalpiteEspecialResponse>('/palpites-especiais', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['palpites-especiais', 'meus'] })
    },
  })
}

export function useConfigPalpitesEspeciais() {
  return useQuery({
    queryKey: ['palpites-especiais', 'config'],
    queryFn: () => apiFetch<{ prazo: string }>('/palpites-especiais/config'),
    staleTime: Infinity,
  })
}

export function useTimes() {
  return useQuery({
    queryKey: ['times'],
    queryFn: () =>
      apiFetch<{ id: string; nome: string; codigo: string | null; grupo: string | null }[]>('/times'),
    staleTime: Infinity,
  })
}