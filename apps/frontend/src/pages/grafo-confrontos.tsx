import { useState, useMemo, useRef, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { GrafoCanvas } from '@/components/grafo-confrontos/grafo-canvas'
import { useGrafoConfrontos, useCiclosConfrontos, useCaminhoMaisLongo } from '@/hooks/use-grafo-confrontos'
import type { ArestaGrafo, CicloResponse, NoGrafo } from '@/types/grafo-confrontos'
import { RefreshCw } from 'lucide-react'

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

      <SecaoCiclos ciclos={ciclosQuery.data} isLoading={ciclosQuery.isLoading} onRecarregar={() => ciclosQuery.refetch()} />
    </div>
  )
}

function SecaoCiclos({
  ciclos,
  isLoading,
  onRecarregar,
}: {
  ciclos: CicloResponse[] | undefined
  isLoading: boolean
  onRecarregar: () => void
}) {
  const [expandido, setExpandido] = useState(false)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  const todosParticipantes = useMemo(() => {
    if (!ciclos) return []
    const set = new Set<string>()
    ciclos.forEach(c => c.participantes.forEach(p => set.add(p)))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [ciclos])

  const participantesFiltradosBusca = useMemo(
    () => todosParticipantes.filter(p => p.toLowerCase().includes(busca.toLowerCase())),
    [todosParticipantes, busca]
  )

  const ordenados = useMemo(
    () => (ciclos ? [...ciclos].sort((a, b) => a.tamanho - b.tamanho) : []),
    [ciclos]
  )

  const ciclosFiltrados = useMemo(() => {
    if (selecionados.size === 0) return ordenados
    return ordenados.filter(c => [...selecionados].every(nome => c.participantes.includes(nome)))
  }, [ordenados, selecionados])

  const visiveis = expandido ? ciclosFiltrados : ciclosFiltrados.slice(0, 5)

  function toggleParticipante(nome: string) {
    setSelecionados(prev => {
      const next = new Set(prev)
      next.has(nome) ? next.delete(nome) : next.add(nome)
      return next
    })
    setExpandido(false)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Ciclos detectados (DFS)</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Grupos de participantes que se vencem mutuamente em cadeia — indicam inconsistência transitiva nos palpites.
          </p>
        </div>
        <button onClick={onRecarregar} className="text-muted-foreground hover:text-foreground transition-colors" title="Recarregar">
          <RefreshCw className="cursor-pointer h-4 w-4" />
        </button>
      </div>

      {/* Filtro multi-select */}
      {!isLoading && ordenados.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setAberto(o => !o)}
            className="cursor-pointer flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors"
          >
            <span className="text-muted-foreground">Filtrar por participante</span>
            {selecionados.size > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                {selecionados.size}
              </span>
            )}
            <span className="text-muted-foreground ml-1">{aberto ? '▲' : '▼'}</span>
          </button>

          {selecionados.size > 0 && (
            <button
              onClick={() => setSelecionados(new Set())}
              className="cursor-pointer ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpar
            </button>
          )}

          {aberto && (
            <div className="bg-sidebar absolute top-full left-0 mt-1 z-20 w-64 rounded-md border border-border bg-popover shadow-lg flex flex-col">
              <div className="p-2 border-b border-border">
                <input
                  autoFocus
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar participante..."
                  className="w-full rounded-sm border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {participantesFiltradosBusca.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-2">Nenhum resultado.</p>
                ) : (
                  participantesFiltradosBusca.map(nome => (
                    <button
                      key={nome}
                      onClick={() => toggleParticipante(nome)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className={`h-3.5 w-3.5 rounded-sm border shrink-0 flex items-center justify-center ${
                        selecionados.has(nome) ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {selecionados.has(nome) && <span className="text-primary-foreground text-[9px] leading-none">✓</span>}
                      </span>
                      <span className="truncate">{nome}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags dos selecionados */}
      {selecionados.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...selecionados].map(nome => (
            <span
              key={nome}
              className="flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs"
            >
              {nome}
              <button onClick={() => toggleParticipante(nome)} className="hover:text-primary/60">✕</button>
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-md" />)}
        </div>
      ) : ordenados.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Nenhum ciclo encontrado no grafo atual.</p>
      ) : ciclosFiltrados.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Nenhum ciclo contém todos os participantes selecionados simultaneamente.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {visiveis.map((ciclo, i) => (
              <div key={i} className="rounded-md border border-border px-3 py-2 flex items-start gap-3">
                <span className="text-xs font-mono bg-muted text-muted-foreground rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                  {ciclo.tamanho}
                </span>
                <p className="text-xs text-foreground/90 wrap-break-word leading-relaxed">
                  {ciclo.participantes.map((p, pi) => (
                    <span key={pi}>
                      <span className={selecionados.has(p) ? 'font-semibold text-primary' : ''}>{p}</span>
                      {pi < ciclo.participantes.length - 1 && <span className="text-muted-foreground"> → </span>}
                    </span>
                  ))}
                  <span className="text-muted-foreground"> → {ciclo.participantes[0]}</span>
                </p>
              </div>
            ))}
          </div>

          {ciclosFiltrados.length > 5 && (
            <button
              onClick={() => setExpandido(e => !e)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              {expandido
                ? '▲ Mostrar menos'
                : `▼ Ver mais ${ciclosFiltrados.length - 5} ciclos`}
            </button>
          )}

          <p className="text-xs text-muted-foreground">
            {selecionados.size > 0
              ? `${ciclosFiltrados.length} de ${ordenados.length} ciclos`
              : `${ordenados.length} ciclos no total`}
          </p>
        </>
      )}
    </div>
  )
}