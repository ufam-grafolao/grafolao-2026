import { API_URL } from "@/lib/env"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./use-auth"
import { useToast } from "@/lib/toast"
import { PalpitarInput } from "@/types/palpites"

export function usePalpitarLote() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  async function salvarLote(
    palpites: PalpitarInput[],
    onProgress?: (concluidos: number, total: number) => void
  ): Promise<{ sucesso: number; erro: number }> {
    let sucesso = 0
    let erro = 0

    await Promise.all(
      palpites.map(async (p) => {
        try {
          const res = await fetch(`${API_URL}/palpites`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(p),
          })
          if (!res.ok) throw new Error()
          sucesso++
        } catch {
          erro++
        } finally {
          onProgress?.(sucesso + erro, palpites.length)
        }
      })
    )

    queryClient.invalidateQueries({ queryKey: ["palpites"] })

    if (erro === 0) {
      toast("success", `${sucesso} palpite${sucesso > 1 ? "s" : ""} salvos!`, "Todos os palpites foram registrados com sucesso.")
    } else if (sucesso > 0) {
      toast("warning", `${sucesso} salvos, ${erro} com erro`, "Alguns palpites não puderam ser salvos.")
    } else {
      toast("error", "Erro ao salvar palpites", "Nenhum palpite foi registrado.")
    }

    return { sucesso, erro }
  }

  return { salvarLote }
}