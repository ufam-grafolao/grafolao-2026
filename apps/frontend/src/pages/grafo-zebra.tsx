import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PainelGrafo, MarcaNo, MarcaTamanho, MarcaLinha } from '@/components/grafo/painel-grafo'
import { GradeMetricas } from '@/components/grafo/cartao-metrica'
import { ControleSegmentado } from '@/components/grafo/controle-segmentado'
import { GavetaDetalhes } from '@/components/grafo/gaveta-detalhes'
import { LimiteDeErroGrafo, PainelCarregando, PainelVazio } from '@/components/grafo/estados-grafo'
import {
  GrafoNaoDirigido,
  type ArestaVisual,
  type GrafoNaoDirigidoHandle,
  type NoVisual,
} from '@/components/grafo/grafo-nao-dirigido'
import { COR_GRAFO, movimentoReduzido } from '@/lib/grafo-visual'
import { rotuloRodadaApi } from '@/lib/rodada'
import { useIsMobile } from '@/hooks/use-mobile'
import { useJogos } from '@/hooks/use-jogos'
import { useJogoZebra, useMstZebra, useRankingZebra } from '@/hooks/use-grafo-zebra'
import type { LinhaRankingZebra, MetricaOusadia, MstAgregadaResponse } from '@/types/grafo-zebra'

const ALTURA_PAINEL = 'h-[27rem] sm:h-[clamp(26rem,66vh,40rem)]'
const MIN_PALPITES = 10 // padrão do backend para ranking e árvore
const TOP = 5

const fmt = (v: number, casas = 0) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

const EXPLICACAO_OUSADIA: Record<MetricaOusadia, string> = {
  media: 'Distância média do palpite aos dos outros no jogo: 0 placar igual, 0,5 mesmo resultado, 1 resultado diferente.',
  mediana: 'A mesma distância, mas o valor do meio: menos puxada por uns poucos palpites muito diferentes.',
  raridade: 'Quanto menos gente deu o mesmo resultado, maior: −ln da fração que concordou (incluindo a própria pessoa).',
}

export default function GrafoZebraPage() {
  const [ousadia, setOusadia] = useState<MetricaOusadia>('media')

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[60ch]">
          <h1 className="text-5xl leading-[0.95] sm:text-6xl">Aventura da Zebra</h1>
          <p className="mt-2 text-muted-foreground">
            Quem acerta com palpites diferentes da maioria sobe no índice.
          </p>
        </div>
        <div className="flex max-w-md flex-col gap-2">
          <ControleSegmentado
            rotulo="Métrica de ousadia"
            valor={ousadia}
            onChange={setOusadia}
            opcoes={[
              { valor: 'media', rotulo: 'Média' },
              { valor: 'mediana', rotulo: 'Mediana' },
              { valor: 'raridade', rotulo: 'Raridade' },
            ]}
          />
          <p className="text-[13px] leading-snug text-muted-foreground" aria-live="polite">
            {EXPLICACAO_OUSADIA[ousadia]}
          </p>
        </div>
      </header>

      <LimiteDeErroGrafo key={ousadia} titulo="Não foi possível carregar a Aventura da Zebra">
        <ConteudoZebra ousadia={ousadia} />
      </LimiteDeErroGrafo>
    </div>
  )
}

function ConteudoZebra({ ousadia }: { ousadia: MetricaOusadia }) {
  const ranking = useRankingZebra(MIN_PALPITES, ousadia)
  const linhas = useMemo(() => ranking.data?.ranking ?? [], [ranking.data])

  return (
    <div className="flex flex-col gap-6">
      <SecaoRanking linhas={linhas} carregando={ranking.isLoading} jogos={ranking.data?.jogosConsiderados} />
      <SecaoArvore linhas={linhas} />
      <SecaoJogo ousadia={ousadia} />
    </div>
  )
}

// ─── Ranking do Índice de Zebra

function SecaoRanking({ linhas, carregando, jogos }: { linhas: LinhaRankingZebra[]; carregando: boolean; jogos?: number }) {
  const [todos, setTodos] = useState(false)
  const visiveis = todos ? linhas : linhas.slice(0, 10)

  return (
    <section aria-labelledby="titulo-ranking-zebra" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 id="titulo-ranking-zebra" className="font-display text-2xl font-bold leading-tight">Índice de Zebra</h2>
        <p className="mt-1 max-w-[75ch] text-sm text-muted-foreground">
          Em cada jogo, ousadia × pontos feitos; a ordem é pela média por jogo palpitado. Só entra quem palpitou{' '}
          {MIN_PALPITES} jogos ou mais{jogos !== undefined && ` (${fmt(jogos)} jogos encerrados considerados)`}.
        </p>
      </div>

      {carregando ? (
        <div className="flex flex-col gap-2" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-md" />)}
        </div>
      ) : linhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguém com {MIN_PALPITES} palpites em jogos encerrados ainda.</p>
      ) : (
        <>
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[30rem] text-left text-sm tabular-nums">
              <caption className="sr-only">Ranking do Índice de Zebra, média por jogo, com soma e número de jogos</caption>
              <thead>
                <tr className="border-b border-border text-[13px] text-muted-foreground">
                  <th scope="col" className="w-12 py-2 pr-2 font-semibold">#</th>
                  <th scope="col" className="py-2 pr-2 font-semibold">Participante</th>
                  <th scope="col" className="py-2 pr-2 text-right font-semibold">Média por jogo</th>
                  <th scope="col" className="py-2 pr-2 text-right font-semibold">Soma</th>
                  <th scope="col" className="py-2 text-right font-semibold">Jogos</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((l) => {
                  const top = l.posicao <= TOP
                  return (
                    <tr key={l.usuarioId} data-top={top || undefined} className={`border-b border-border last:border-0 ${top ? 'bg-gold/10 dark:bg-gold/[0.06]' : ''}`}>
                      <td className="py-2.5 pr-2 font-display text-lg font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          {l.posicao}
                          {top && <span className="size-2.5 rounded-full bg-gold ring-1 ring-gold-foreground/70 dark:ring-0" aria-hidden />}
                        </span>
                        {top && <span className="sr-only"> (top {TOP})</span>}
                      </td>
                      <td className="max-w-0 truncate py-2.5 pr-2 font-medium">{l.nome}</td>
                      <td className="py-2.5 pr-2 text-right font-semibold">{fmt(l.indiceMedio, 2)}</td>
                      <td className="py-2.5 pr-2 text-right text-muted-foreground">{fmt(l.indice, 1)}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{fmt(l.jogosPalpitados)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {linhas.length > 10 && (
            <button
              type="button"
              onClick={() => setTodos((t) => !t)}
              aria-expanded={todos}
              className="flex min-h-11 cursor-pointer items-center gap-1.5 self-start text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {todos ? 'Mostrar só os 10 primeiros' : `Ver todos os ${fmt(linhas.length)}`}
              <ChevronDown className={`size-4 transition-transform motion-reduce:transition-none ${todos ? 'rotate-180' : ''}`} aria-hidden />
            </button>
          )}
        </>
      )}
    </section>
  )
}

// ─── Árvore geradora mínima agregada

function montarVisual(mst: MstAgregadaResponse, porId: Map<string, LinhaRankingZebra>) {
  const maxIndice = Math.max(1e-9, ...mst.nos.map((n) => porId.get(n.id)?.indiceMedio ?? 0))
  const nos: NoVisual[] = mst.nos.map((n) => {
    const l = porId.get(n.id)
    const top = !!l && l.posicao <= TOP
    return {
      id: n.id,
      rotulo: n.nome,
      tamanho: (l?.indiceMedio ?? 0) / maxIndice,
      cor: top ? COR_GRAFO.noDestaque : COR_GRAFO.no,
      fixarRotulo: top,
    }
  })
  // distância 0 (iguais) = força 1: aresta curta e mais visível
  const arestas: ArestaVisual[] = mst.arestas.map((a) => ({ origem: a.origem, destino: a.destino, forca: 1 - a.peso }))
  return { nos, arestas }
}

function SecaoArvore({ linhas }: { linhas: LinhaRankingZebra[] }) {
  const mst = useMstZebra(MIN_PALPITES)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const canvasRef = useRef<GrafoNaoDirigidoHandle>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const porId = useMemo(() => new Map(linhas.map((l) => [l.usuarioId, l])), [linhas])
  const visual = useMemo(() => (mst.data ? montarVisual(mst.data, porId) : null), [mst.data, porId])
  const carregando = mst.isLoading
  const vazio = !carregando && (!mst.data || mst.data.nos.length === 0)
  const comp = mst.data?.componentes

  useEffect(() => {
    if (isMobile && selecionado) {
      painelRef.current?.scrollIntoView({ block: 'start', behavior: movimentoReduzido() ? 'auto' : 'smooth' })
    }
  }, [isMobile, selecionado])

  const selecionar = (id: string | null) => {
    setSelecionado(id)
    if (id) canvasRef.current?.focar(id)
  }

  return (
    <section aria-labelledby="titulo-arvore" className="flex flex-col gap-4">
      <div>
        <h2 id="titulo-arvore" className="font-display text-3xl font-bold leading-tight">Árvore geradora mínima</h2>
        <p className="mt-1 max-w-[75ch] text-sm text-muted-foreground">
          Liga todo mundo com o menor total de distância entre palpites. Quem fica perto palpita parecido; as pontas soltas
          são os palpites mais diferentes.
        </p>
      </div>

      <GradeMetricas
        metricas={[
          { rotulo: 'Participantes', valor: carregando ? null : fmt(mst.data?.nos.length ?? 0), explicacao: `${MIN_PALPITES} palpites ou mais.` },
          { rotulo: 'Ligações na árvore', valor: carregando ? null : fmt(mst.data?.arestas.length ?? 0), explicacao: `Cada par precisa de ${mst.data?.minJogosEmComum ?? 3} jogos ou mais em comum.` },
          {
            rotulo: 'Componentes',
            valor: carregando ? null : fmt(comp ?? 0),
            explicacao: comp === 1 ? 'Uma árvore só: todos estão ligados.' : 'Floresta: há grupos sem jogos em comum suficientes entre si.',
          },
          { rotulo: 'Distância total', valor: carregando ? null : fmt(mst.data?.pesoTotal ?? 0, 1), explicacao: 'Soma das distâncias das ligações.' },
        ]}
      />

      {comp !== undefined && comp > 1 && (
        <p role="status" className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          A árvore saiu partida em <strong className="font-semibold">{fmt(comp)} componentes</strong> (uma floresta): não há
          jogos em comum suficientes para ligar todos os grupos.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <PainelGrafo ref={painelRef} className={`scroll-mt-2 ${ALTURA_PAINEL}`}>
          {carregando ? (
            <PainelCarregando mensagem="Montando a árvore…" />
          ) : vazio || !visual ? (
            <PainelVazio titulo="Ainda não há árvore" descricao="A árvore aparece quando houver participantes com jogos encerrados em comum." />
          ) : (
            <GrafoNaoDirigido
              ref={canvasRef}
              nos={visual.nos}
              arestas={visual.arestas}
              selecionadoId={selecionado}
              onSelecionarNo={setSelecionado}
              descricao={`Árvore geradora mínima com ${mst.data!.nos.length} participantes e ${mst.data!.arestas.length} ligações. O ranking acima e a lista ao lado trazem os mesmos participantes para explorar por teclado.`}
              legenda={[
                { marca: <MarcaNo cor={COR_GRAFO.noDestaque} />, texto: <><span className="text-grafo-texto">Top {TOP}</span> do Índice de Zebra</> },
                { marca: <MarcaTamanho />, texto: 'Tamanho do nó = índice médio' },
                { marca: <MarcaLinha cor={COR_GRAFO.rotulo} />, texto: 'Linha mais curta e forte = palpites mais parecidos' },
                {
                  marca: <span className="w-3 shrink-0 text-center font-bold text-grafo-texto" aria-hidden>d</span>,
                  texto: <>Distância: <span className="text-grafo-texto">0</span> mesmo placar, <span className="text-grafo-texto">0,5</span> mesmo resultado, <span className="text-grafo-texto">1</span> resultado diferente</>,
                },
              ]}
              dicaLegenda="Par = média nos jogos em comum. Há empates: com outro desempate, outra árvore de mesmo total também seria mínima."
            />
          )}
        </PainelGrafo>

        <aside aria-label="Participante na árvore" className="rounded-xl border border-border bg-card p-5 lg:h-[clamp(26rem,66vh,40rem)] lg:overflow-y-auto">
          {carregando ? (
            <div className="flex flex-col gap-3" aria-hidden>
              <Skeleton className="h-7 w-48 rounded" />
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-md" />)}
            </div>
          ) : selecionado && !isMobile && mst.data ? (
            <DetalheZebra id={selecionado} mst={mst.data} porId={porId} onSelecionar={selecionar} />
          ) : (
            <ListaTopZebra linhas={linhas} onSelecionar={selecionar} />
          )}
        </aside>
      </div>

      <GavetaDetalhes aberta={isMobile && !!selecionado} onFechar={() => setSelecionado(null)} titulo="Detalhes do participante">
        {selecionado && mst.data && (
          <DetalheZebra id={selecionado} mst={mst.data} porId={porId} onSelecionar={selecionar} mostrarFechar={false} />
        )}
      </GavetaDetalhes>
    </section>
  )
}

function ListaTopZebra({ linhas, onSelecionar }: { linhas: LinhaRankingZebra[]; onSelecionar: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="font-display text-2xl font-bold leading-tight">Top {TOP} na árvore</h3>
        <p className="mt-1 text-sm text-muted-foreground">Escolha alguém para ver de quem palpita mais perto.</p>
      </div>
      <ol className="flex flex-col gap-1.5">
        {linhas.slice(0, TOP).map((l) => (
          <li key={l.usuarioId}>
            <button
              type="button"
              onClick={() => onSelecionar(l.usuarioId)}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="w-6 text-right font-display text-lg font-bold">{l.posicao}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{l.nome}</span>
              <span className="text-sm font-semibold tabular-nums">{fmt(l.indiceMedio, 2)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

function DetalheZebra({
  id,
  mst,
  porId,
  onSelecionar,
  mostrarFechar = true,
}: {
  id: string
  mst: MstAgregadaResponse
  porId: Map<string, LinhaRankingZebra>
  onSelecionar: (id: string | null) => void
  mostrarFechar?: boolean
}) {
  const nomes = useMemo(() => new Map(mst.nos.map((n) => [n.id, n.nome])), [mst.nos])
  const l = porId.get(id)
  const vizinhos = mst.arestas
    .filter((a) => a.origem === id || a.destino === id)
    .map((a) => ({ id: a.origem === id ? a.destino : a.origem, peso: a.peso, jogos: a.jogosEmComum }))
    .sort((a, b) => a.peso - b.peso)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-2xl font-bold leading-tight">{nomes.get(id) ?? id}</h3>
          {l && <p className="mt-0.5 text-sm text-muted-foreground">{l.posicao}º no Índice de Zebra</p>}
        </div>
        {mostrarFechar && (
          <button
            type="button"
            onClick={() => onSelecionar(null)}
            className="-m-1.5 grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Fechar detalhes e voltar ao top 5"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {l && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div><dt className="text-muted-foreground">Média por jogo</dt><dd className="font-display text-2xl font-bold tabular-nums">{fmt(l.indiceMedio, 2)}</dd></div>
          <div><dt className="text-muted-foreground">Soma</dt><dd className="font-display text-2xl font-bold tabular-nums">{fmt(l.indice, 1)}</dd></div>
          <div><dt className="text-muted-foreground">Jogos palpitados</dt><dd className="font-semibold tabular-nums">{fmt(l.jogosPalpitados)}</dd></div>
          <div><dt className="text-muted-foreground">Acertos ousados</dt><dd className="font-semibold tabular-nums">{fmt(l.acertosOusados)}</dd></div>
        </dl>
      )}

      <div>
        <h4 className="text-sm font-semibold">Vizinhos na árvore</h4>
        <p className="text-[13px] text-muted-foreground">Do mais parecido ao menos parecido.</p>
        <ul className="mt-1.5 flex flex-col">
          {vizinhos.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onSelecionar(v.id)}
                className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="truncate">{nomes.get(v.id) ?? v.id}</span>
                <span className="shrink-0 text-right tabular-nums">
                  <span className="font-semibold">distância {fmt(v.peso, 2)}</span>
                  {v.jogos !== undefined && <span className="block text-xs text-muted-foreground">{fmt(v.jogos)} jogos em comum</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Detalhe de um jogo encerrado

function SecaoJogo({ ousadia }: { ousadia: MetricaOusadia }) {
  const jogos = useJogos({ status: 'ENCERRADO' })
  const ordenados = useMemo(
    () => [...(jogos.data ?? [])].sort((a, b) => b.dataHora.localeCompare(a.dataHora)),
    [jogos.data],
  )
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const jogoId = escolhido ?? ordenados[0]?.id ?? null
  const detalhe = useJogoZebra(jogoId, ousadia)
  const d = detalhe.data

  // agrupa por rodada, mantendo a ordem de data (mais recente primeiro)
  const grupos = useMemo(() => {
    const m = new Map<string, typeof ordenados>()
    for (const j of ordenados) m.set(j.rodada, [...(m.get(j.rodada) ?? []), j])
    return [...m.entries()]
  }, [ordenados])

  const nomeTime = (t: string | null) => t ?? 'A definir'

  return (
    <section aria-labelledby="titulo-jogo-zebra" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="titulo-jogo-zebra" className="font-display text-2xl font-bold leading-tight">Zebras de um jogo</h2>
          <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
            Os palpites mais ousados que pontuaram num jogo encerrado.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Jogo encerrado
          <select
            value={jogoId ?? ''}
            onChange={(e) => setEscolhido(e.target.value)}
            disabled={ordenados.length === 0}
            className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm md:w-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {grupos.map(([rodada, js]) => (
              <optgroup key={rodada} label={rotuloRodadaApi(rodada).longo}>
                {js.map((j) => (
                  <option key={j.id} value={j.id}>
                    {nomeTime(j.timeCasa?.nome ?? j.timeCasaRef)} × {nomeTime(j.timeVisitante?.nome ?? j.timeVisitanteRef)}
                    {j.resultado ? ` (${j.resultado.golsCasa}–${j.resultado.golsVisitante})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {jogos.isLoading || (detalhe.isLoading && !!jogoId) ? (
        <div className="flex flex-col gap-2" aria-hidden>
          <Skeleton className="h-10 w-64 rounded" />
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-md" />)}
        </div>
      ) : ordenados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum jogo encerrado ainda.</p>
      ) : detalhe.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível abrir este jogo. Os palpites só aparecem depois que o jogo é encerrado.
        </p>
      ) : d ? (
        <div className="flex flex-col gap-3" aria-live="polite">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-3xl font-bold leading-none">
              {nomeTime(d.jogo.timeCasa)} {d.jogo.golsCasa ?? '–'} × {d.jogo.golsVisitante ?? '–'} {nomeTime(d.jogo.timeVisitante)}
            </span>
            <span className="text-sm text-muted-foreground">
              {rotuloRodadaApi(d.jogo.rodada).longo} · {fmt(d.nos.length)} palpites
            </span>
          </p>
          {d.ousadosQueAcertaram.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguém pontuou com palpite ousado neste jogo.</p>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[26rem] text-left text-sm tabular-nums">
                <caption className="sr-only">Palpites mais ousados que pontuaram, do mais ousado para o menos</caption>
                <thead>
                  <tr className="border-b border-border text-[13px] text-muted-foreground">
                    <th scope="col" className="py-2 pr-2 font-semibold">Participante</th>
                    <th scope="col" className="py-2 pr-2 text-center font-semibold">Palpite</th>
                    <th scope="col" className="py-2 pr-2 text-right font-semibold">Pontos</th>
                    <th scope="col" className="py-2 text-right font-semibold">Ousadia</th>
                  </tr>
                </thead>
                <tbody>
                  {d.ousadosQueAcertaram.map((p) => (
                    <tr key={p.usuarioId} className="border-b border-border last:border-0">
                      <td className="max-w-0 truncate py-2.5 pr-2 font-medium">{p.nome}</td>
                      <td className="py-2.5 pr-2 text-center font-semibold">{p.golsCasa}–{p.golsVisitante}</td>
                      <td className="py-2.5 pr-2 text-right">{fmt(p.pontos)}</td>
                      <td className="py-2.5 text-right font-semibold">{fmt(p.ousadia, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
