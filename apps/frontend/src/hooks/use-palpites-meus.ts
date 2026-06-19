import { useQuery } from "@tanstack/react-query"
import { useAuth } from "./use-auth"
import { apiFetch } from '@/lib/api-client'
import { PalpiteExistente } from "@/types/palpites"

export function useMeusPalpites() {
  const { token } = useAuth()

  return useQuery<PalpiteExistente[]>({
    queryKey: ["palpites", "meus"],
    queryFn: () => apiFetch<PalpiteExistente[]>('/palpites/meus'),
    enabled: !!token,
    staleTime: 1 * 60 * 1000,
  })
}
