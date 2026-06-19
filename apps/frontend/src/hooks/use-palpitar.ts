import { apiFetch } from '@/lib/api-client'
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/lib/toast"
import { PalpitarInput } from "@/types/palpites"

export default function usePalpitar() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    return useMutation({
        mutationFn: (input: PalpitarInput) =>
            apiFetch('/palpites', { method: 'POST', body: JSON.stringify(input) }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['palpites'] })
            toast('success', "Palpite salvo!", "Seu palpite foi registrado com sucesso.")
        },
        onError: (error) => {
            toast('error', "Erro ao salvar palpite", error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.')
        }
    })
}
