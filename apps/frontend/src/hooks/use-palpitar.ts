import { API_URL } from "@/lib/env";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useToast } from "@/lib/toast";

interface PalpitarInput {
  jogoId: string
  golsCasa: number
  golsVisitante: number
}

export default function usePalpitar() {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const {toast} = useToast()

    return useMutation({
        mutationFn: async ({ jogoId, golsCasa, golsVisitante}: PalpitarInput) => {
            const res = await fetch(`${API_URL}/palpites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ jogoId, golsCasa, golsVisitante }),
            });

            if (!res.ok) throw new Error('Erro ao enviar palpite');

            return res.json();
        },

        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['palpites']})
            toast('success', "Palpite salvo no banco!", "Seu palpite foi registrado com sucesso.");
        },

        onError: (error) => {
            toast('error', "Erro ao salvar palpite", error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao salvar seu palpite.');
        }
    })
}