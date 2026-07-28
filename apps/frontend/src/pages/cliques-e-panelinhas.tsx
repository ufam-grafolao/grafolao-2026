import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw } from 'lucide-react'
import { useCliquesEPanelinhas } from '@/hooks/use-cliques-e-panelinhas'
import type { CliquesOrdem, CliquesResponse } from '@/types/cliques-e-panelinhas'
import { BicliqueCanvas, type BicliqueCardData } from '@/components/cliques-e-panelinhas/biclique-canvas'
import { CliquesInspector } from '@/components/cliques-e-panelinhas/cliques-inspector'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}

function resolverBicliques(data: CliquesResponse | undefined) {
  if (!data) return [] as BicliqueCardData[]

  return data.bicliques.slice(0, 3).map((biclique, indice) => ({
    indice,
    biclique,
    usuarios: biclique[0].map(posicao => data.usuarios[posicao]).filter(Boolean),
    jogos: biclique[1].map(posicao => data.jogos[posicao]).filter(Boolean),
  }))
}

const ORDENACOES: Array<{ label: string; value: CliquesOrdem }> = [
  { label: 'Arestas', value: 'arestas' },
  { label: 'Vértices', value: 'vertices' },
  { label: 'Usuários', value: 'usuarios' },
  { label: 'Jogos', value: 'jogos' },
]

export default function CliquesEPanelinhasPage() {
  const [ordem, setOrdem] = useState<CliquesOrdem>('arestas')
  const [minimoUsuarios, setMinimoUsuarios] = useState(2)
  const [minimoJogos, setMinimoJogos] = useState(1)
  const [comigo, setComigo] = useState(false)
  const [comJogo, setComJogo] = useState('')
  const [selecionada, setSelecionada] = useState(0)

  const cliquesQuery = useCliquesEPanelinhas({
    ordem,
    minimoUsuarios,
    minimoJogos,
    comigo,
    comJogo,
  })

  const bicliques = useMemo(() => resolverBicliques(cliquesQuery.data), [cliquesQuery.data])
  const bicliqueSelecionada = bicliques.find(item => item.indice === selecionada) ?? bicliques[0] ?? null

  const totalUsuarios = cliquesQuery.data?.totalUsuarios ?? 0
  const totalJogos = cliquesQuery.data?.totalJogos ?? 0
  const totalBicliques = cliquesQuery.data?.totalBicliques ?? 0
  const maiorBiclique = bicliques[0]

  if (selecionada >= bicliques.length && bicliques.length > 0) {
    setSelecionada(0);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Cliques e Panelinhas</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Usuários e jogos são dispostos em um grafo bipartido, onde as arestas denotam que o usuário acertou um palpite naquele jogo. A partir desse grafo, é possível extrair bicliques máximas, que representam panelinhas de usuários que acertaram os mesmos jogos.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Usuários retornados" value={String(totalUsuarios)} />
            <StatCard label="Jogos retornados" value={String(totalJogos)} />
            <StatCard label="Bicliques máximais" value={String(totalBicliques)} />
            <StatCard label="Maior biclique" value={maiorBiclique ? `${maiorBiclique.usuarios.length} usuários x ${maiorBiclique.jogos.length} jogos` : '—'} />
          </div>

          <button
            type="button"
            onClick={() => cliquesQuery.refetch()}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={comigo}
                onChange={event => setComigo(event.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Apenas bicliques que me incluem
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs text-muted-foreground">Mínimo de usuários</span>
              <Input
                type="number"
                min={0}
                value={minimoUsuarios}
                onChange={event => setMinimoUsuarios(Number(event.target.value) || 0)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs text-muted-foreground">Mínimo de jogos</span>
              <Input
                type="number"
                min={0}
                value={minimoJogos}
                onChange={event => setMinimoJogos(Number(event.target.value) || 0)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs text-muted-foreground">Filtrar por jogo</span>
              <Input
                value={comJogo}
                onChange={event => setComJogo(event.target.value)}
                placeholder="ID do jogo (opcional)"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex flex-col flex-wrap items-start gap-2">
              <span className="text-xs text-muted-foreground">Ordenar por</span>
              <div className="flex flex-wrap items-start gap-2">
                {ORDENACOES.map(item => (
                  <Button
                    key={item.value}
                    size="sm"
                    variant={ordem === item.value ? 'default' : 'outline'}
                    onClick={() => setOrdem(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {cliquesQuery.isLoading ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[840px] rounded-2xl" />
          <Skeleton className="h-[840px] rounded-2xl" />
        </div>
      ) : cliquesQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Erro ao carregar os cliques máximos.
        </div>
      ) : bicliques.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhuma biclique máxima passou pelos filtros atuais.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <BicliqueCanvas
            bicliques={bicliques}
            selecionada={selecionada}
            onSelecionar={setSelecionada}
          />
          <CliquesInspector
            bicliqueSelecionada={bicliqueSelecionada}
            bicliques={bicliques}
            onSelecionar={indice => setSelecionada(indice)}
          />
        </div>
      )}
    </div>
  )
}