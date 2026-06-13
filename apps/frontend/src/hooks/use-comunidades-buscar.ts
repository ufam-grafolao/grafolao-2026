import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/env'
import type { ComunidadeComContagem } from '@/types/comunidade'
import { useState } from 'react'
import { useDebounce } from 'use-debounce'

export function useBuscarComunidades() {
  const { token } = useAuth()

  const [ busca, setBusca ] = useState('')
  const [ debouncedBusca ] = useDebounce(busca, 400)

  const { data, isFetching } = useQuery<ComunidadeComContagem[]>({
    queryKey: ['comunidades', 'buscar', debouncedBusca],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/comunidades/buscar?q=${encodeURIComponent(debouncedBusca)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao buscar comunidades')
      return res.json()
    },
    enabled: !!token && debouncedBusca.length >= 2,
    staleTime: 30 * 1000,
  })

  return { data, isFetching, setBusca, busca }
}