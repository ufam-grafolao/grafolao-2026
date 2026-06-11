import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './use-auth'
import { API_URL } from '@/lib/env'
import { InserirResultadoInput } from '@/types/resultado'

export function useInserirResultado() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ jogoId, ...body }: InserirResultadoInput) => {
      const res = await fetch(`${API_URL}/admin/jogos/${jogoId}/resultado`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Falha ao inserir resultado')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jogos'] })
      queryClient.invalidateQueries({ queryKey: ['palpites'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}