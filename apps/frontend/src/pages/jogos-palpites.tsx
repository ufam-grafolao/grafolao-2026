import JogoCard from "@/components/jogos/jogo-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useJogos } from "@/hooks/use-jogos"
import { useJogosHoje } from "@/hooks/use-jogos-hoje"
import { useMeusPalpites } from "@/hooks/use-meus-palpites"
import { Jogo } from "@/types/jogo"


function JogosGrid({ jogos, isLoading, palpites}: {
    jogos: Jogo[] | undefined,
    isLoading: boolean,
    palpites: ReturnType<typeof useMeusPalpites>['data']
}) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
            </div>
        )
    }

    const jogosFiltrados = jogos?.filter(j => j.status !== 'BLOQUEADO') ?? []

    if (jogosFiltrados.length === 0) {
        return (
        <p className="text-sm text-muted-foreground text-center py-12">
            Nenhum jogo disponível.
        </p>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
        {jogosFiltrados.map(jogo => (
            <JogoCard
            key={jogo.id}
            jogo={jogo}
            palpitesExistente={palpites}
            mostrarBotaoPalpite
            />
        ))}
        </div>
    )
}

export default function JogosPalpitesPage() {
  const { data: jogos,      isLoading: loadingJogos }    = useJogos()
  const { data: jogosHoje,  isLoading: loadingHoje }     = useJogosHoje()
  const { data: meusPalpites, isLoading: loadingPalpites } = useMeusPalpites()

  return (
    <div className="h-full w-full">
      <Tabs defaultValue="todos" className="w-full h-full flex flex-col">
        <TabsList variant="line">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
        </TabsList>

        <TabsContent className="flex-1 overflow-y-auto pr-2 mt-4" value="todos">
          <JogosGrid
            jogos={jogos}
            isLoading={loadingJogos || loadingPalpites}
            palpites={meusPalpites}
          />
        </TabsContent>

        <TabsContent className="flex-1 overflow-y-auto pr-2 mt-4" value="hoje">
          <JogosGrid
            jogos={jogosHoje}
            isLoading={loadingHoje || loadingPalpites}
            palpites={meusPalpites}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}