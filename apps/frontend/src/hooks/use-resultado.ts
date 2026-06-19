import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import { InserirResultadoInput } from '@/types/resultado'

export function useInserirResultado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jogoId, ...body }: InserirResultadoInput) =>
      apiFetch(`/admin/jogos/${jogoId}/resultado`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jogos'] })
      queryClient.invalidateQueries({ queryKey: ['palpites'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}
