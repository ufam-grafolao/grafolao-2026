import { API_URL } from "@/lib/env";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { PalpiteExistente } from "@/types/palpites";

export function useMeusPalpites() {

    const {token} = useAuth()

  return useQuery<PalpiteExistente[]>({
    queryKey: ["palpites", "meus"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/palpites/meus`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erro ao buscar palpites");
      return response.json();
    },
    enabled: !!token,
    staleTime: 1 * 60 * 1000,
  });
}