import { useState, useMemo, useRef } from "react"
import JogoCard from "@/components/cards/jogo-card"
import JogoCardLote, { type RascunhoLote } from "@/components/cards/jogo-card-lote"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useJogos } from "@/hooks/use-jogos"
import { useJogosHoje } from "@/hooks/use-jogos-hoje"
import { useMeusPalpites } from "@/hooks/use-palpites-meus"
import { usePalpitarLote } from "@/hooks/use-palpitar-lote"
import type { Jogo } from "@/types/jogo"
import { Clock, Layers, X, Loader2, CheckCheck } from "lucide-react"

type PalpitesData = ReturnType<typeof useMeusPalpites>["data"]

const GRID = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"

function SkeletonGrid({ count = 8, className = "h-48" }: { count?: number; className?: string }) {
  return (
    <div className={`${GRID} pb-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${className} rounded-xl`} />
      ))}
    </div>
  )
}

// ─── Grid simples (uma lista plana de jogos)

function JogosGrid({
  jogos,
  isLoading,
  palpites,
}: {
  jogos: Jogo[] | undefined
  isLoading: boolean
  palpites: PalpitesData
}) {
  if (isLoading) return <SkeletonGrid />

  const visiveis = jogos?.filter((j) => j.status !== "BLOQUEADO") ?? []
  if (visiveis.length === 0) return (
    <p className="text-sm text-muted-foreground text-center py-12">Nenhum jogo disponível.</p>
  )

  return (
    <div className={`${GRID} pb-6`}>
      {visiveis.map((jogo) => (
        <JogoCard key={jogo.id} jogo={jogo} palpitesExistente={palpites} mostrarBotaoPalpite />
      ))}
    </div>
  )
}

// ─── Grid com seções por grupo + pills de navegação

function JogosGrupos({
  jogos,
  isLoading,
  palpites,
  scrollRef,
}: {
  jogos: Jogo[] | undefined
  isLoading: boolean
  palpites: PalpitesData
  scrollRef: React.RefObject<HTMLDivElement | null>
}) {
  const secoes = useMemo(() => {
    if (!jogos) return []
    const map = new Map<string, Jogo[]>()
    for (const j of jogos) {
      if (!j.grupo || j.status === "BLOQUEADO") continue
      const label = j.grupo.replace("Group", "Grupo")
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(j)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [jogos])

  function scrollToGrupo(label: string) {
    const el = document.getElementById(`secao-${label}`)
    const container = scrollRef.current
    if (!el || !container) return
    const offset = el.offsetTop - container.offsetTop - 8
    container.scrollTo({ top: offset, behavior: "smooth" })
  }

  if (isLoading) return <SkeletonGrid count={12} />

  if (secoes.length === 0) return (
    <p className="text-sm text-muted-foreground text-center py-12">Nenhum jogo de grupos disponível.</p>
  )

  return (
    <div className="flex flex-col gap-8 pb-6">
      {/* Pills de navegação */}
      <div className="flex flex-wrap gap-2">
        {secoes.map(([label]) => (
          <button
            key={label}
            onClick={() => scrollToGrupo(label)}
            className="text-xs font-medium px-3 py-1 rounded-full border border-border bg-muted/50 hover:bg-muted hover:border-primary/40 transition-colors cursor-pointer"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Seções */}
      {secoes.map(([label, jogosDo]) => (
        <section key={label} id={`secao-${label}`}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {label}
          </h2>
          <div className={GRID}>
            {jogosDo.map((jogo) => (
              <JogoCard key={jogo.id} jogo={jogo} palpitesExistente={palpites} mostrarBotaoPalpite />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ─── Grid com seções por fase do mata-mata + pills de navegação

const ORDEM_FASES: Record<string, { label: string; ordem: number }> = {
  "Round of 32":          { label: "Pré-oitavas",        ordem: 1 },
  "Round of 16":          { label: "Oitavas de final",   ordem: 2 },
  "Quarter-final":        { label: "Quartas de final",   ordem: 3 },
  "Semi-final":           { label: "Semifinais",         ordem: 4 },
  "Match for third place":{ label: "Disputa de 3º lugar",ordem: 5 },
  "Final":                { label: "Final",              ordem: 6 },
}

function JogosMataMata({
  jogos,
  isLoading,
  palpites,
  scrollRef,
}: {
  jogos: Jogo[] | undefined
  isLoading: boolean
  palpites: PalpitesData
  scrollRef: React.RefObject<HTMLDivElement | null>
}) {
  const secoes = useMemo(() => {
    if (!jogos) return []
    const map = new Map<string, Jogo[]>()
    for (const j of jogos) {
      if (j.grupo || j.status === "BLOQUEADO") continue
      if (!map.has(j.rodada)) map.set(j.rodada, [])
      map.get(j.rodada)!.push(j)
    }
    return [...map.entries()].sort(([a], [b]) => {
      const oa = ORDEM_FASES[a]?.ordem ?? 99
      const ob = ORDEM_FASES[b]?.ordem ?? 99
      return oa - ob
    })
  }, [jogos])

  function scrollToFase(rodada: string) {
    const el = document.getElementById(`fase-${rodada}`)
    const container = scrollRef.current
    if (!el || !container) return
    container.scrollTo({ top: el.offsetTop - container.offsetTop - 8, behavior: "smooth" })
  }

  if (isLoading) return <SkeletonGrid count={8} />

  if (secoes.length === 0) return (
    <p className="text-sm text-muted-foreground text-center py-12">Nenhum jogo de mata-mata disponível.</p>
  )

  return (
    <div className="flex flex-col gap-8 pb-6">
      <div className="flex flex-wrap gap-2">
        {secoes.map(([rodada]) => (
          <button
            key={rodada}
            onClick={() => scrollToFase(rodada)}
            className="text-xs font-medium px-3 py-1 rounded-full border border-border bg-muted/50 hover:bg-muted hover:border-primary/40 transition-colors cursor-pointer"
          >
            {ORDEM_FASES[rodada]?.label ?? rodada}
          </button>
        ))}
      </div>

      {secoes.map(([rodada, jogosDa]) => (
        <section key={rodada} id={`fase-${rodada}`}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {ORDEM_FASES[rodada]?.label ?? rodada}
          </h2>
          <div className={GRID}>
            {jogosDa.map((jogo) => (
              <JogoCard key={jogo.id} jogo={jogo} palpitesExistente={palpites} mostrarBotaoPalpite />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ─── Grid lote (modo em massa)

function JogosGridLote({
  jogos,
  isLoading,
  palpites,
  rascunhos,
  onChange,
}: {
  jogos: Jogo[] | undefined
  isLoading: boolean
  palpites: PalpitesData
  rascunhos: Record<string, RascunhoLote>
  onChange: (jogoId: string, campo: "golsCasa" | "golsVisitante", valor: number | null) => void
}) {
  if (isLoading) return <SkeletonGrid count={8} className="h-32" />

  const visiveis = jogos?.filter((j) => j.status !== "BLOQUEADO") ?? []
  if (visiveis.length === 0) return (
    <p className="text-sm text-muted-foreground text-center py-12">Nenhum jogo disponível para palpitar.</p>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-24">
      {visiveis.map((jogo) => (
        <JogoCardLote
          key={jogo.id}
          jogo={jogo}
          rascunho={rascunhos[jogo.id] ?? { jogoId: jogo.id, golsCasa: null, golsVisitante: null }}
          palpiteExistente={palpites?.find((p) => p.jogo.id === jogo.id)}
          onChange={onChange}
        />
      ))}
    </div>
  )
}

// ─── Page principal

export default function JogosPalpitesPage() {
  const { data: jogos,        isLoading: loadingJogos }    = useJogos()
  const { data: jogosHoje,    isLoading: loadingHoje }     = useJogosHoje()
  const { data: meusPalpites, isLoading: loadingPalpites } = useMeusPalpites()
  const { salvarLote } = usePalpitarLote()

  const [modoLote, setModoLote] = useState(false)
  const [rascunhos, setRascunhos] = useState<Record<string, RascunhoLote>>({})
  const [salvando, setSalvando] = useState(false)
  const [progresso, setProgresso] = useState<{ concluidos: number; total: number } | null>(null)
  const [tabAtiva, setTabAtiva] = useState('hoje')
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleChange(jogoId: string, campo: "golsCasa" | "golsVisitante", valor: number | null) {
    setRascunhos((prev) => ({
      ...prev,
      [jogoId]: {
        jogoId,
        golsCasa: campo === "golsCasa" ? valor : (prev[jogoId]?.golsCasa ?? null),
        golsVisitante: campo === "golsVisitante" ? valor : (prev[jogoId]?.golsVisitante ?? null),
      },
    }))
  }

  const palpitesProntos = useMemo(
    () =>
      Object.values(rascunhos).filter(
        (r) => r.golsCasa !== null && r.golsVisitante !== null
      ) as { jogoId: string; golsCasa: number; golsVisitante: number }[],
    [rascunhos]
  )

  async function handleSalvarLote() {
    if (palpitesProntos.length === 0) return
    setSalvando(true)
    setProgresso({ concluidos: 0, total: palpitesProntos.length })
    await salvarLote(palpitesProntos, (concluidos, total) => setProgresso({ concluidos, total }))
    setSalvando(false)
    setProgresso(null)
    setRascunhos({})
    setModoLote(false)
  }

  function handleCancelarLote() {
    setRascunhos({})
    setModoLote(false)
  }

  const temGrupos   = useMemo(() => jogos?.some(j =>  j.grupo) ?? false, [jogos])
  const temMataMata = useMemo(() => jogos?.some(j => !j.grupo) ?? false, [jogos])

  const jogosFiltrados = useMemo(() => {
    if (tabAtiva === 'hoje')     return jogosHoje
    if (tabAtiva === 'mata-mata') return jogos?.filter(j => !j.grupo)
    if (tabAtiva === 'grupos')   return jogos  // grupos filtra internamente
    return jogos                               // 'todos'
  }, [tabAtiva, jogos, jogosHoje])

  const isLoadingAtual = tabAtiva === 'hoje'
    ? loadingHoje || loadingPalpites
    : loadingJogos || loadingPalpites

  return (
    <div className="h-[93%] w-full flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Jogos e Palpites</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe os jogos e faça seus palpites
          </p>
        </div>
        {!modoLote && (
          <Button variant="outline" size="lg" onClick={() => setModoLote(true)}>
            <Layers className="h-4 w-4 mr-2" />
            Palpitar em lote
          </Button>
        )}
      </div>

      <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="w-full h-full flex flex-col">
        <div className="overflow-x-auto shrink-0">
          <TabsList variant="line" className="w-max min-w-full">
            <TabsTrigger value="hoje">Hoje</TabsTrigger>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            {temMataMata && <TabsTrigger value="mata-mata">Mata-mata</TabsTrigger>}
            {temGrupos   && <TabsTrigger value="grupos">Grupos</TabsTrigger>}
          </TabsList>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 mb-1 shrink-0">
          <Clock className="h-3 w-3" />
          <span>Horários em GMT-4 (horário de Manaus)</span>
          {modoLote && (
            <span className="ml-2 text-primary font-medium">
              · Modo lote ativo — preencha os placares e salve tudo de uma vez
            </span>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 mt-4">
          {tabAtiva === 'grupos' && !modoLote ? (
            <JogosGrupos
              jogos={jogos}
              isLoading={isLoadingAtual}
              palpites={meusPalpites}
              scrollRef={scrollRef}
            />
          ) : tabAtiva === 'mata-mata' && !modoLote ? (
            <JogosMataMata
              jogos={jogos}
              isLoading={isLoadingAtual}
              palpites={meusPalpites}
              scrollRef={scrollRef}
            />
          ) : modoLote ? (
            <JogosGridLote
              jogos={jogosFiltrados}
              isLoading={isLoadingAtual}
              palpites={meusPalpites}
              rascunhos={rascunhos}
              onChange={handleChange}
            />
          ) : (
            <JogosGrid
              jogos={jogosFiltrados}
              isLoading={isLoadingAtual}
              palpites={meusPalpites}
            />
          )}
        </div>
      </Tabs>

      {/* Barra flutuante de ações do modo lote */}
      {modoLote && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-sidebar border border-border shadow-xl rounded-full px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            onClick={handleCancelarLote}
            disabled={salvando}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <div className="w-px h-5 bg-border" />
          <Button
            size="sm"
            className="rounded-full"
            disabled={palpitesProntos.length === 0 || salvando}
            onClick={handleSalvarLote}
          >
            {salvando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {progresso ? `${progresso.concluidos}/${progresso.total}` : "Salvando..."}
              </>
            ) : (
              <>
                <CheckCheck className="h-4 w-4 mr-2" />
                {palpitesProntos.length === 0
                  ? "Preencha os palpites"
                  : `Salvar ${palpitesProntos.length} palpite${palpitesProntos.length > 1 ? "s" : ""}`}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}