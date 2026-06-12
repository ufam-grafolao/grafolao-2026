import { API_URL } from "@/lib/env";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface PalpitarInput {
  jogoId: string
  golsCasa: number
  golsVisitante: number
}

export default function usePalpitar() {
    const { token } = useAuth()
    const queryClient = useQueryClient()

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
            alert("Palpite salvo no banco!");
        }
    })
}