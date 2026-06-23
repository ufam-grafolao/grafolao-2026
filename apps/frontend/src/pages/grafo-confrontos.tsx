import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { GrafoCanvas } from '@/components/grafo-confrontos/grafo-canvas'
import { useGrafoConfrontos, useCiclosConfrontos, useCaminhoMaisLongo } from '@/hooks/use-grafo-confrontos'
import type { ArestaGrafo, NoGrafo } from '@/types/grafo-confrontos'

function AvatarMini({ nome, avatarUrl }: { nome: string; avatarUrl: string | null }) {
  const [erro, setErro] = useState(false)
  if (avatarUrl && !erro) {
    return <img src={avatarUrl} alt={nome} className="h-9 w-9 rounded-full object-cover shrink-0" onError={() => setErro(true)} />
  }
  return (
    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
      {nome.charAt(0).toUpperCase()}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}

function obterConfrontosDoNo(noId: string, arestas: ArestaGrafo[], nos: NoGrafo[]) {
  const nomePorId = new Map(nos.map(n => [n.id, n.nome]))
  const vitorias = arestas
    .filter(a => a.origem === noId)
    .map(a => ({ nome: nomePorId.get(a.destino) ?? a.destino, peso: a.peso }))
    .sort((a, b) => b.peso - a.peso)
  const derrotas = arestas
    .filter(a => a.destino === noId)
    .map(a => ({ nome: nomePorId.get(a.origem) ?? a.origem, peso: a.peso }))
    .sort((a, b) => b.peso - a.peso)
  return { vitorias, derrotas }
}

export default function GrafoConfrontosPage() {
  const [minPalpites, setMinPalpites] = useState(10)
  const [noSelecionado, setNoSelecionado] = useState<NoGrafo | null>(null)

  const grafoQuery = useGrafoConfrontos(minPalpites)
  const ciclosQuery = useCiclosConfrontos(minPalpites)
  const caminhoMutation = useCaminhoMaisLongo()

  const nos = grafoQuery.data?.nos ?? []
  const arestas = grafoQuery.data?.arestas ?? []
  const densidade =
    nos.length > 1 ? ((arestas.length / (nos.length * (nos.length - 1))) * 100).toFixed(1) + '%' : '—'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Grafo de Confrontos — Duelo de Palpiteiros</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cada aresta representa um saldo de confrontos diretos positivo entre dois participantes.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={minPalpites === 10 ? 'default' : 'outline'} size="sm" onClick={() => setMinPalpites(10)}>
          Núcleo ativo (≥10 palpites)
        </Button>
        <Button variant={minPalpites === 0 ? 'default' : 'outline'} size="sm" onClick={() => setMinPalpites(0)}>
          Grafo completo
        </Button>
      </div>

      {grafoQuery.isLoading ? (
        <Skeleton className="h-16 rounded-lg" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Participantes (|V|)" value={String(nos.length)} />
          <StatCard label="Confrontos (|E|)" value={String(arestas.length)} />
          <StatCard label="Densidade" value={densidade} />
          <StatCard label="Ciclos detectados" value={ciclosQuery.isLoading ? '...' : String(ciclosQuery.data?.length ?? '—')} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="relative h-[560px] rounded-lg border border-border bg-card overflow-hidden">
          {grafoQuery.isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : grafoQuery.isError ? (
            <div className="h-full flex items-center justify-center text-sm text-destructive">
              Erro ao carregar o grafo.
            </div>
          ) : (
            <GrafoCanvas nos={nos} arestas={arestas} onSelecionarNo={setNoSelecionado} />
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 lg:h-[560px] overflow-y-auto">
          {noSelecionado ? (
            <>
                <div className="flex items-center gap-3">
                <AvatarMini nome={noSelecionado.nome} avatarUrl={noSelecionado.avatarUrl} />
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{noSelecionado.nome}</p>
                    <p className="text-xs text-muted-foreground">#{noSelecionado.posicao} no PageRank</p>
                </div>
                </div>
                <p className="text-sm">
                Score: <span className="font-mono">{noSelecionado.pageRank.toFixed(5)}</span>
                </p>

                {(() => {
                const { vitorias, derrotas } = obterConfrontosDoNo(noSelecionado.id, arestas, nos)
                return (
                    <>
                    {vitorias.length > 0 && (
                        <div>
                        <p className="text-xs font-semibold text-emerald-600 mb-1">Vitórias sobre ({vitorias.length})</p>
                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                            {vitorias.map((v, i) => (
                            <div key={i} className="flex items-center justify-between text-xs gap-2">
                                <span className="truncate">{v.nome}</span>
                                <span className="font-mono text-muted-foreground shrink-0">+{v.peso}</span>
                            </div>
                            ))}
                        </div>
                        </div>
                    )}
                    {derrotas.length > 0 && (
                        <div>
                        <p className="text-xs font-semibold text-rose-600 mb-1">Derrotas para ({derrotas.length})</p>
                        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                            {derrotas.map((d, i) => (
                            <div key={i} className="flex items-center justify-between text-xs gap-2">
                                <span className="truncate">{d.nome}</span>
                                <span className="font-mono text-muted-foreground shrink-0">-{d.peso}</span>
                            </div>
                            ))}
                        </div>
                        </div>
                    )}
                    </>
                )
                })()}

                <Button variant="outline" size="sm" onClick={() => setNoSelecionado(null)}>Voltar ao Top 5</Button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">Top 5 — PageRank</p>
              {nos.slice(0, 5).map(n => (
                <button
                  key={n.id}
                  onClick={() => setNoSelecionado(n)}
                  className="flex items-center gap-2 text-sm text-left hover:bg-muted/50 rounded-md px-1 py-1"
                >
                  <span className="w-5 text-center text-muted-foreground font-semibold shrink-0">{n.posicao}</span>
                  <span className="flex-1 truncate">{n.nome}</span>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{n.pageRank.toFixed(4)}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => caminhoMutation.mutate({ minPalpites, orcamentoMs: 10000 })}
            disabled={caminhoMutation.isPending}
          >
            {caminhoMutation.isPending ? 'Calculando (até 10s)...' : 'Calcular caminho mais longo'}
          </Button>
          {caminhoMutation.data && (
            <span className="text-sm text-muted-foreground">
              {caminhoMutation.data.tamanho} participantes em{' '}
              {(caminhoMutation.data.tempoMs / 1000).toFixed(1)}s
              {!caminhoMutation.data.completou && ' (limite inferior — busca não esgotada)'}
            </span>
          )}
        </div>
        {caminhoMutation.data && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Ver cadeia completa</summary>
            <p className="mt-1 break-words">{caminhoMutation.data.participantes.join(' → ')}</p>
          </details>
        )}
      </div>
    </div>
  )
}