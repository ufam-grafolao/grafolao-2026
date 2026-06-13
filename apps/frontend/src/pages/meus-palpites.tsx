import { useJogos } from '@/hooks/use-jogos'
import { useMeusPalpites } from '@/hooks/use-palpites-meus'
import JogoCard from '@/components/cards/jogo-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Jogo } from '@/types/jogo'

function JogosGrid({ jogos, isLoading, palpites }: {
  jogos: Jogo[] | undefined
  isLoading: boolean
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

  // só jogos que o usuário palpitou ou que já encerraram
  const jogosFiltrados = jogos?.filter(j =>
    j.status !== 'BLOQUEADO' &&
    (j.status === 'ENCERRADO' || palpites?.some(p => p.jogo.id === j.id))
  ) ?? []

  if (jogosFiltrados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Nenhum palpite feito ainda.
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
          mostrarBotaoPalpite={false}
        />
      ))}
    </div>
  )
}

export default function MeusPalpitesPage() {
  const { data: jogos,     isLoading: loadingJogos }    = useJogos()
  const { data: palpites,  isLoading: loadingPalpites } = useMeusPalpites()

  const pendentes  = jogos?.filter(j => j.status === 'AGENDADO'  && palpites?.some(p => p.jogo.id === j.id))
  const encerrados = jogos?.filter(j => j.status === 'ENCERRADO' && palpites?.some(p => p.jogo.id === j.id))
  const semPalpite = jogos?.filter(j => j.status === 'ENCERRADO' && !palpites?.some(p => p.jogo.id === j.id))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Meus Palpites</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe seus palpites e pontuação por jogo.
        </p>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList variant="line">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="encerrados">
            Encerrados
            {encerrados && encerrados.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">({encerrados.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pendentes">
            Aguardando
            {pendentes && pendentes.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">({pendentes.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sem-palpite">
            Sem palpite
            {semPalpite && semPalpite.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">({semPalpite.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4" value="todos">
          <JogosGrid jogos={jogos} isLoading={loadingJogos || loadingPalpites} palpites={palpites} />
        </TabsContent>

        <TabsContent className="mt-4" value="encerrados">
          <JogosGrid jogos={encerrados} isLoading={loadingJogos || loadingPalpites} palpites={palpites} />
        </TabsContent>

        <TabsContent className="mt-4" value="pendentes">
          <JogosGrid jogos={pendentes} isLoading={loadingJogos || loadingPalpites} palpites={palpites} />
        </TabsContent>

        <TabsContent className="mt-4" value="sem-palpite">
          <JogosGrid jogos={semPalpite} isLoading={loadingJogos || loadingPalpites} palpites={palpites} />
        </TabsContent>
      </Tabs>
    </div>
  )
}