import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronDown, RefreshCw, Route, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { GrafoCanvas, type GrafoCanvasHandle } from '@/components/grafo-confrontos/grafo-canvas'
import { DetalheParticipante, ListaTop } from '@/components/grafo-confrontos/painel-participante'
import { BuscaParticipante } from '@/components/grafo-confrontos/busca-participante'
import { PainelGrafo } from '@/components/grafo/painel-grafo'
import { GradeMetricas } from '@/components/grafo/cartao-metrica'
import { ControleSegmentado } from '@/components/grafo/controle-segmentado'
import { GavetaDetalhes } from '@/components/grafo/gaveta-detalhes'
import { LimiteDeErroGrafo, PainelCarregando, PainelVazio } from '@/components/grafo/estados-grafo'
import { movimentoReduzido } from '@/lib/grafo-visual'
import { useIsMobile } from '@/hooks/use-mobile'
import { useGrafoConfrontos, useCiclosConfrontos, useCaminhoMaisLongo } from '@/hooks/use-grafo-confrontos'
import type { CicloResponse, NoGrafo } from '@/types/grafo-confrontos'

const ALTURA_PAINEL = 'h-[27rem] sm:h-[clamp(26rem,66vh,42rem)]'

export default function GrafoConfrontosPage() {
  const [minPalpites, setMinPalpites] = useState(10)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[60ch]">
          <h1 className="text-5xl leading-[0.95] sm:text-6xl">Grafo de Confrontos</h1>
          <p className="mt-2 text-muted-foreground">
            Cada seta liga quem levou a melhor no saldo de confrontos diretos a quem ficou atrás.
          </p>
        </div>
        <ControleSegmentado
          rotulo="Recorte do grafo"
          valor={minPalpites}
          onChange={setMinPalpites}
          opcoes={[
            { valor: 10, rotulo: 'Núcleo ativo', detalhe: '10 palpites ou mais' },
            { valor: 0, rotulo: 'Grafo completo', detalhe: 'todos os participantes' },
          ]}
        />
      </header>

      {/* Uma falha da API aparece aqui dentro; cabeçalho e navegação continuam na tela */}
      <LimiteDeErroGrafo key={minPalpites} titulo="Não foi possível carregar o grafo">
        <ConteudoGrafo minPalpites={minPalpites} onVerCompleto={() => setMinPalpites(0)} />
      </LimiteDeErroGrafo>
    </div>
  )
}

function ConteudoGrafo({ minPalpites, onVerCompleto }: { minPalpites: number; onVerCompleto: () => void }) {
  const [noSelecionado, setNoSelecionado] = useState<NoGrafo | null>(null)
  const canvasRef = useRef<GrafoCanvasHandle>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const grafoQuery = useGrafoConfrontos(minPalpites)
  const ciclosQuery = useCiclosConfrontos(minPalpites)
  const caminhoMutation = useCaminhoMaisLongo()

  const nos = grafoQuery.data?.nos ?? []
  const arestas = grafoQuery.data?.arestas ?? []
  const densidade =
    nos.length > 1 ? ((arestas.length / (nos.length * (nos.length - 1))) * 100).toFixed(1) + '%' : '—'
  const vazio = !grafoQuery.isLoading && nos.length === 0

  const selecionarEFocar = (no: NoGrafo) => {
    setNoSelecionado(no)
    canvasRef.current?.focar(no.id)
  }

  // No celular a gaveta ocupa a metade de baixo: traz o painel para o topo para o foco continuar à vista
  useEffect(() => {
    if (isMobile && noSelecionado) {
      painelRef.current?.scrollIntoView({ block: 'start', behavior: movimentoReduzido() ? 'auto' : 'smooth' })
    }
  }, [isMobile, noSelecionado])

  return (
    <div className="flex flex-col gap-6">
      <GradeMetricas
        metricas={[
          { rotulo: 'Participantes', valor: grafoQuery.isLoading ? null : nos.length.toLocaleString('pt-BR'), explicacao: 'Cada pessoa no recorte é um nó.' },
          { rotulo: 'Confrontos', valor: grafoQuery.isLoading ? null : arestas.length.toLocaleString('pt-BR'), explicacao: 'Pares em que alguém tem saldo positivo sobre o outro.' },
          { rotulo: 'Densidade', valor: grafoQuery.isLoading ? null : densidade.replace('.', ','), explicacao: 'Parte das ligações possíveis que existe de fato.' },
          { rotulo: 'Ciclos', valor: ciclosQuery.isLoading ? null : (ciclosQuery.data?.length.toLocaleString('pt-BR') ?? '—'), explicacao: 'Cadeias em que A vence B, B vence C e C vence A.' },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BuscaParticipante nos={nos} onEscolher={selecionarEFocar} />
        <p className="hidden text-sm text-muted-foreground md:block">Arraste para mover o grafo e role para aproximar.</p>
      </div>

      <div className="-mt-2 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <PainelGrafo ref={painelRef} className={`scroll-mt-2 ${ALTURA_PAINEL}`}>
          {grafoQuery.isLoading ? (
            <PainelCarregando mensagem="Montando o grafo de confrontos…" />
          ) : vazio ? (
            <PainelVazio
              titulo="Nenhum confronto neste recorte"
              descricao="Uma seta aparece quando, nos jogos que os dois palpitaram, um participante fez mais pontos que o outro mais vezes do que o contrário."
              acao={minPalpites > 0 ? { rotulo: 'Ver o grafo completo', onClick: onVerCompleto } : undefined}
            />
          ) : (
            <GrafoCanvas
              ref={canvasRef}
              nos={nos}
              arestas={arestas}
              selecionadoId={noSelecionado?.id ?? null}
              onSelecionarNo={setNoSelecionado}
            />
          )}
        </PainelGrafo>

        <aside aria-label="Participante" className="rounded-xl border border-border bg-card p-5 lg:h-[clamp(26rem,66vh,42rem)] lg:overflow-hidden">
          {grafoQuery.isLoading ? (
            <div className="flex flex-col gap-3" aria-hidden>
              <Skeleton className="h-7 w-48 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-md" />)}
            </div>
          ) : vazio ? (
            <div>
              <h2 className="font-display text-2xl font-bold leading-tight">Top 5 do PageRank</h2>
              <p className="mt-1 text-sm text-muted-foreground">O ranking aparece assim que houver confrontos no recorte.</p>
            </div>
          ) : noSelecionado && !isMobile ? (
            <DetalheParticipante
              no={noSelecionado}
              nos={nos}
              arestas={arestas}
              onSelecionar={setNoSelecionado}
              onCentralizar={(id) => canvasRef.current?.focar(id)}
            />
          ) : (
            <ListaTop nos={nos} onSelecionar={selecionarEFocar} />
          )}
        </aside>
      </div>

      {/* Celular: detalhes numa gaveta em meia altura, sem cobrir o foco no grafo */}
      <GavetaDetalhes aberta={isMobile && !!noSelecionado} onFechar={() => setNoSelecionado(null)} titulo="Detalhes do participante">
        {noSelecionado && (
          <DetalheParticipante
            no={noSelecionado}
            nos={nos}
            arestas={arestas}
            onSelecionar={(no) => (no ? selecionarEFocar(no) : setNoSelecionado(null))}
            onCentralizar={(id) => canvasRef.current?.focar(id)}
            mostrarFechar={false}
          />
        )}
      </GavetaDetalhes>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <section aria-labelledby="titulo-caminho" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <div>
            <h2 id="titulo-caminho" className="font-display text-2xl font-bold leading-tight">Caminho mais longo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A maior corrente em que cada participante venceu o seguinte. A busca tem até 10 segundos.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-11 self-start border-input px-4"
            onClick={() => caminhoMutation.mutate({ minPalpites, orcamentoMs: 10000 })}
            disabled={caminhoMutation.isPending || vazio || grafoQuery.isLoading}
          >
            <Route aria-hidden />
            {caminhoMutation.isPending ? 'Calculando (até 10s)…' : 'Calcular caminho mais longo'}
          </Button>
          {caminhoMutation.isError && (
            <p role="alert" className="text-sm text-destructive">Não foi possível calcular agora. Tente de novo.</p>
          )}
          {caminhoMutation.data && (
            <div aria-live="polite">
              <p className="font-display text-4xl font-bold leading-none tabular-nums">
                {caminhoMutation.data.tamanho}
                <span className="ml-1.5 font-sans text-sm font-semibold">participantes</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                em {(caminhoMutation.data.tempoMs / 1000).toFixed(1).replace('.', ',')}s
                {!caminhoMutation.data.completou && ' (limite inferior — busca não esgotada)'}
              </p>
              <details className="mt-2 text-sm">
                <summary className="flex min-h-11 cursor-pointer items-center font-medium text-primary">Ver a corrente completa</summary>
                <p className="mt-1 break-words leading-relaxed text-muted-foreground">{caminhoMutation.data.participantes.join(' → ')}</p>
              </details>
            </div>
          )}
        </section>

        <div className="lg:col-span-2">
          <SecaoCiclos ciclos={ciclosQuery.data} isLoading={ciclosQuery.isLoading} onRecarregar={() => ciclosQuery.refetch()} />
        </div>
      </div>
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
      if (next.has(nome)) next.delete(nome)
      else next.add(nome)
      return next
    })
    setExpandido(false)
  }

  return (
    <section aria-labelledby="titulo-ciclos" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="titulo-ciclos" className="font-display text-2xl font-bold leading-tight">Ciclos detectados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Grupos que se vencem em cadeia (A vence B, B vence C, C vence A), encontrados por busca em profundidade. Mostram que a relação “levou a melhor” não é transitiva.
          </p>
        </div>
        <button
          type="button"
          onClick={onRecarregar}
          className="-mr-2 -mt-1 grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-[background-color,color] duration-150 hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Recarregar ciclos"
          title="Recarregar"
        >
          <RefreshCw className="size-4" aria-hidden />
        </button>
      </div>

      {/* Filtro multi-select */}
      {!isLoading && ordenados.length > 0 && (
        <div className="relative flex flex-wrap items-center gap-2" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setAberto(o => !o)}
            aria-expanded={aberto}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3.5 text-sm transition-[background-color] duration-150 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="text-muted-foreground">Filtrar por participante</span>
            {selecionados.size > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary-foreground">
                {selecionados.size}
              </span>
            )}
            <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-150 ${aberto ? 'rotate-180' : ''}`} aria-hidden />
          </button>

          {selecionados.size > 0 && (
            <button
              type="button"
              onClick={() => setSelecionados(new Set())}
              className="h-11 cursor-pointer rounded-md px-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Limpar
            </button>
          )}

          {aberto && (
            <div className="absolute left-0 top-full z-20 mt-1 flex w-72 flex-col rounded-md border border-border bg-popover shadow-lg">
              <div className="border-b border-border p-2">
                <input
                  autoFocus
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar participante…"
                  aria-label="Buscar participante nos ciclos"
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="max-h-64 overflow-y-auto overscroll-contain p-1">
                {participantesFiltradosBusca.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado.</p>
                ) : (
                  participantesFiltradosBusca.map(nome => (
                    <button
                      type="button"
                      key={nome}
                      onClick={() => toggleParticipante(nome)}
                      aria-pressed={selecionados.has(nome)}
                      className="flex min-h-11 w-full items-center gap-2.5 rounded-sm px-3 text-left text-sm transition-[background-color] duration-150 hover:bg-secondary"
                    >
                      <span className={`flex size-4 shrink-0 items-center justify-center rounded-sm border ${
                        selecionados.has(nome) ? 'border-primary bg-primary' : 'border-input'
                      }`}>
                        {selecionados.has(nome) && <span className="text-[10px] leading-none text-primary-foreground">✓</span>}
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
            <span key={nome} className="flex items-center gap-1 rounded-full bg-secondary py-0.5 pl-3 pr-1 text-sm text-secondary-foreground">
              {nome}
              <button
                type="button"
                onClick={() => toggleParticipante(nome)}
                className="grid size-7 place-items-center rounded-full hover:bg-background focus-visible:outline-2 focus-visible:outline-ring"
                aria-label={`Remover ${nome} do filtro`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-md" />)}
        </div>
      ) : ordenados.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">Nenhum ciclo encontrado no grafo atual.</p>
      ) : ciclosFiltrados.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          Nenhum ciclo contém todos os participantes selecionados simultaneamente.
        </p>
      ) : (
        <>
          <ol className="flex flex-col divide-y divide-border rounded-md border border-border">
            {visiveis.map((ciclo, i) => (
              <li key={i} className="flex items-start gap-3 px-3 py-2.5">
                <span className="mt-0.5 shrink-0 rounded bg-secondary px-1.5 py-0.5 text-xs font-semibold tabular-nums text-secondary-foreground" title="Tamanho do ciclo">
                  {ciclo.tamanho}
                </span>
                <p className="text-sm leading-relaxed wrap-break-word">
                  {ciclo.participantes.map((p, pi) => (
                    <span key={pi}>
                      <span className={selecionados.has(p) ? 'font-semibold text-primary' : ''}>{p}</span>
                      {pi < ciclo.participantes.length - 1 && <span className="text-muted-foreground"> → </span>}
                    </span>
                  ))}
                  <span className="text-muted-foreground"> → {ciclo.participantes[0]}</span>
                </p>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground tabular-nums">
              {selecionados.size > 0
                ? `${ciclosFiltrados.length} de ${ordenados.length} ciclos`
                : `${ordenados.length} ciclos no total`}
            </p>
            {ciclosFiltrados.length > 5 && (
              <button
                type="button"
                onClick={() => setExpandido(e => !e)}
                aria-expanded={expandido}
                className="flex h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {expandido ? 'Mostrar menos' : `Ver mais ${ciclosFiltrados.length - 5} ciclos`}
                <ChevronDown className={`size-4 transition-transform duration-150 ${expandido ? 'rotate-180' : ''}`} aria-hidden />
              </button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
