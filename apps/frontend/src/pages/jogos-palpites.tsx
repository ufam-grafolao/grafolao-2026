import { useState, useMemo } from "react"
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

// ─── Grid normal (modo individual)

function JogosGrid({
  jogos,
  isLoading,
  palpites,
}: {
  jogos: Jogo[] | undefined
  isLoading: boolean
  palpites: ReturnType<typeof useMeusPalpites>["data"]
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

  const jogosFiltrados = jogos?.filter((j) => j.status !== "BLOQUEADO") ?? []

  if (jogosFiltrados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Nenhum jogo disponível.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
      {jogosFiltrados.map((jogo) => (
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
  palpites: ReturnType<typeof useMeusPalpites>["data"]
  rascunhos: Record<string, RascunhoLote>
  onChange: (jogoId: string, campo: "golsCasa" | "golsVisitante", valor: number | null) => void
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-24">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    )
  }

  const agendados = jogos?.filter((j) => j.status === "AGENDADO") ?? []

  if (agendados.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Nenhum jogo disponível para palpitar.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-24">
      {agendados.map((jogo) => (
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

    await salvarLote(palpitesProntos, (concluidos, total) => {
      setProgresso({ concluidos, total })
    })

    setSalvando(false)
    setProgresso(null)
    setRascunhos({})
    setModoLote(false)
  }

  function handleCancelarLote() {
    setRascunhos({})
    setModoLote(false)
  }

  const [tabAtiva, setTabAtiva] = useState('hoje')

  // Grupos únicos ordenados — só atualiza quando jogos chegam
  const grupos = useMemo(() => {
    if (!jogos) return []
    const set = new Set<string>()
    jogos.forEach(j => { if (j.grupo) set.add(j.grupo) })
    return [...set].sort()
  }, [jogos])

  const temMataMata = useMemo(
    () => jogos?.some(j => !j.grupo) ?? false,
    [jogos]
  )

  // Filtra jogos conforme tab ativa — um único bloco de conteúdo
  const jogosFiltrados = useMemo(() => {
    if (tabAtiva === 'hoje') return jogosHoje
    if (tabAtiva === 'todos') return jogos
    if (tabAtiva === 'mata-mata') return jogos?.filter(j => !j.grupo)
    if (tabAtiva.startsWith('grupo-')) {
      const g = tabAtiva.replace('grupo-', '')
      return jogos?.filter(j => j.grupo === g)
    }
    return jogos
  }, [tabAtiva, jogos, jogosHoje])

  const isLoadingAtual = tabAtiva === 'hoje'
    ? loadingHoje || loadingPalpites
    : loadingJogos || loadingPalpites

  return (
    <div className="h-full w-full flex flex-col gap-6">
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
            {grupos.map(g => (
              <TabsTrigger key={g} value={`grupo-${g}`}>
                {g.replace('Group', 'Grupo')}
              </TabsTrigger>
            ))}
            {temMataMata && (
              <TabsTrigger value="mata-mata">Mata-mata</TabsTrigger>
            )}
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

        {/* Conteúdo único — muda conforme tab ativa */}
        <div className="flex-1 overflow-y-auto pr-2 mt-4">
          {modoLote ? (
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
                {progresso
                  ? `${progresso.concluidos}/${progresso.total}`
                  : "Salvando..."}
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