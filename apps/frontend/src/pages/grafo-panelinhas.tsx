import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PainelGrafo, MarcaNo, MarcaTamanho, MarcaLinha } from '@/components/grafo/painel-grafo'
import { GradeMetricas } from '@/components/grafo/cartao-metrica'
import { ControleSegmentado } from '@/components/grafo/controle-segmentado'
import { Interruptor } from '@/components/grafo/interruptor'
import { GavetaDetalhes } from '@/components/grafo/gaveta-detalhes'
import { GraficoLinhas } from '@/components/grafo/grafico-linhas'
import { LimiteDeErroGrafo, PainelCarregando, PainelVazio } from '@/components/grafo/estados-grafo'
import {
  GrafoNaoDirigido,
  type ArestaVisual,
  type GrafoNaoDirigidoHandle,
  type GrupoAceso,
  type NoVisual,
} from '@/components/grafo/grafo-nao-dirigido'
import { COR_GRAFO, COR_NO_RECUADO, CORES_PANELA, movimentoReduzido } from '@/lib/grafo-visual'
import { rotuloRodadaApi } from '@/lib/rodada'
import { useIsMobile } from '@/hooks/use-mobile'
import { usePanelinhas, useSeriePanelinhas, type FiltrosPanelinhas } from '@/hooks/use-grafo-panelinhas'
import type { NoPanelinhas, Panela, PanelinhasResponse } from '@/types/grafo-panelinhas'

const ALTURA_PAINEL = 'h-[27rem] sm:h-[clamp(26rem,66vh,42rem)]'
/** "Jogo óbvio": acertado por mais de 80% de quem palpitou (um dos cortes testados no backend) */
const CORTE_OBVIOS = 0.8

const fmt = (v: number, casas = 0) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

export default function GrafoPanelinhasPage() {
  const [minPalpites, setMinPalpites] = useState(10)
  const [percentil, setPercentil] = useState(90)
  const [semObvios, setSemObvios] = useState(false)
  const filtros: FiltrosPanelinhas = { minPalpites, percentil, excluirAcimaDe: semObvios ? CORTE_OBVIOS : undefined }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="max-w-[60ch]">
          <h1 className="text-5xl leading-[0.95] sm:text-6xl">Cliques e Panelinhas</h1>
          <p className="mt-2 text-muted-foreground">
            Grupos em que todos acertaram muitos jogos em comum, dois a dois.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <ControleSegmentado
            rotulo="Limiar de ligação"
            valor={percentil}
            onChange={setPercentil}
            opcoes={[
              { valor: 90, rotulo: 'Percentil 90', detalhe: '10% dos pares mais fortes' },
              { valor: 95, rotulo: 'Percentil 95', detalhe: '5% dos pares mais fortes' },
            ]}
          />
          <ControleSegmentado
            rotulo="Recorte de participantes"
            valor={minPalpites}
            onChange={setMinPalpites}
            opcoes={[
              { valor: 10, rotulo: 'Núcleo ativo', detalhe: '10 palpites ou mais' },
              { valor: 0, rotulo: 'Completo', detalhe: 'todos os participantes' },
            ]}
          />
          <Interruptor
            rotulo="Excluir jogos óbvios"
            detalhe={`Tira jogos acertados por mais de ${fmt(CORTE_OBVIOS * 100)}% de quem palpitou`}
            ligado={semObvios}
            onChange={setSemObvios}
          />
        </div>
      </header>

      <LimiteDeErroGrafo key={`${minPalpites}-${percentil}-${semObvios}`} titulo="Não foi possível carregar as panelinhas">
        <ConteudoPanelinhas filtros={filtros} onVerCompleto={() => setMinPalpites(0)} />
      </LimiteDeErroGrafo>
    </div>
  )
}

function ConteudoPanelinhas({ filtros, onVerCompleto }: { filtros: FiltrosPanelinhas; onVerCompleto: () => void }) {
  const consulta = usePanelinhas(filtros)
  const [noSelecionado, setNoSelecionado] = useState<string | null>(null)
  const [panelaAcesa, setPanelaAcesa] = useState<number | null>(null)
  const canvasRef = useRef<GrafoNaoDirigidoHandle>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  const dados = consulta.data
  const carregando = consulta.isLoading
  const panelas = useMemo(() => dados?.maioresPanelas.slice(0, CORES_PANELA.length) ?? [], [dados])
  const visual = useMemo(() => (dados ? montarVisual(dados, panelas) : null), [dados, panelas])
  const vazio = !carregando && (!dados || dados.nos.length === 0 || dados.arestas.length === 0)

  const grupo: GrupoAceso | null = useMemo(
    () =>
      panelaAcesa !== null && panelas[panelaAcesa]
        ? { membros: new Set(panelas[panelaAcesa].participantes.map((p) => p.id)), cor: CORES_PANELA[panelaAcesa] }
        : null,
    [panelaAcesa, panelas],
  )

  const selecionar = (id: string | null) => {
    setNoSelecionado(id)
    if (id) canvasRef.current?.focar(id)
  }

  useEffect(() => {
    if (isMobile && noSelecionado) {
      painelRef.current?.scrollIntoView({ block: 'start', behavior: movimentoReduzido() ? 'auto' : 'smooth' })
    }
  }, [isMobile, noSelecionado])

  const no = noSelecionado ? dados?.nos.find((n) => n.id === noSelecionado) ?? null : null
  const v = (s: string) => (carregando ? null : s)

  return (
    <div className="flex flex-col gap-6">
      {dados && !dados.completou && (
        <p role="status" className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <span>
            <strong className="font-semibold">Resultado parcial.</strong> A busca de panelas parou no limite de tempo
            ({fmt(dados.tempoMs / 1000, 1)} s). A maior panela e as contagens abaixo são um mínimo, não o valor final.
          </span>
        </p>
      )}

      <GradeMetricas
        metricas={[
          {
            rotulo: 'Maior panela',
            valor: v(dados ? fmt(dados.cliqueMaxima.tamanho) : '—'),
            explicacao: 'Participantes no maior grupo em que todos estão ligados entre si.',
          },
          {
            rotulo: 'Panelas (3 ou mais)',
            valor: v(dados ? fmt(dados.totalPanelas) : '—'),
            explicacao: 'Grupos maximais: ninguém de fora se liga a todos eles.',
          },
          {
            rotulo: `Média das ${dados?.k ?? 5} maiores`,
            valor: v(dados ? fmt(dados.tamanhoMedioTopK, 1) : '—'),
            explicacao: 'Tamanho médio das maiores panelas.',
          },
          {
            rotulo: 'Limiar usado',
            valor: v(dados?.limiar != null ? `${fmt(dados.limiar)} jogos` : '—'),
            explicacao: dados
              ? `Percentil ${fmt(dados.percentil)}: um par se liga com ${dados.limiar ?? '—'} ou mais acertos em comum (de ${fmt(dados.jogosConsiderados)} jogos).`
              : 'Acertos em comum para um par virar ligação.',
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <PainelGrafo ref={painelRef} className={`scroll-mt-2 ${ALTURA_PAINEL}`}>
          {carregando ? (
            <PainelCarregando mensagem="Procurando as panelinhas…" />
          ) : vazio || !visual ? (
            <PainelVazio
              titulo="Nenhuma ligação neste recorte"
              descricao="Uma ligação aparece quando dois participantes acertaram juntos pelo menos o número de jogos do limiar."
              acao={filtros.minPalpites > 0 ? { rotulo: 'Ver todos os participantes', onClick: onVerCompleto } : undefined}
            />
          ) : (
            <GrafoNaoDirigido
              ref={canvasRef}
              nos={visual.nos}
              arestas={visual.arestas}
              grupo={grupo}
              selecionadoId={noSelecionado}
              onSelecionarNo={setNoSelecionado}
              descricao={`Grafo de similaridade com ${dados!.nos.length} participantes e ${dados!.arestas.length} ligações. As maiores panelas estão na lista ao lado; use-a para explorar por teclado.`}
              legenda={[
                { marca: <MarcaNo cor={CORES_PANELA[0]} />, texto: <><span className="text-grafo-texto">Cores:</span> as {panelas.length} maiores panelas</> },
                { marca: <MarcaTamanho />, texto: 'Tamanho do nó = em quantas panelas aparece' },
                { marca: <MarcaLinha cor={COR_GRAFO.rotulo} />, texto: 'Linha = acertaram juntos o limiar ou mais' },
              ]}
            />
          )}
        </PainelGrafo>

        <aside aria-label="Panelas e participante" className="rounded-xl border border-border bg-card p-5 lg:h-[clamp(26rem,66vh,42rem)] lg:overflow-y-auto">
          {carregando ? (
            <div className="flex flex-col gap-3" aria-hidden>
              <Skeleton className="h-7 w-48 rounded" />
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
            </div>
          ) : no && !isMobile && dados ? (
            <DetalhePanelinha no={no} dados={dados} panelas={panelas} onSelecionar={selecionar} onAcender={setPanelaAcesa} />
          ) : (
            <ListaPanelas panelas={panelas} acesa={panelaAcesa} onAcender={setPanelaAcesa} />
          )}
        </aside>
      </div>

      <GavetaDetalhes aberta={isMobile && !!no} onFechar={() => setNoSelecionado(null)} titulo="Detalhes do participante">
        {no && dados && (
          <DetalhePanelinha no={no} dados={dados} panelas={panelas} onSelecionar={selecionar} onAcender={setPanelaAcesa} mostrarFechar={false} />
        )}
      </GavetaDetalhes>

      <SecaoSerie filtros={filtros} />
    </div>
  )
}

/** Cor de repouso: a maior panela de que o nó participa; quem não está em nenhuma recua. */
function montarVisual(dados: PanelinhasResponse, panelas: Panela[]) {
  const corDe = new Map<string, string>()
  panelas.forEach((p, i) => p.participantes.forEach((m) => !corDe.has(m.id) && corDe.set(m.id, CORES_PANELA[i])))
  const maxPanelas = Math.max(1, ...dados.nos.map((n) => n.panelas))
  const lider = new Set(panelas[0]?.participantes.map((p) => p.id) ?? [])
  const nos: NoVisual[] = dados.nos.map((n) => ({
    id: n.id,
    rotulo: n.nome,
    tamanho: n.panelas / maxPanelas,
    cor: corDe.get(n.id) ?? COR_NO_RECUADO,
    fixarRotulo: lider.has(n.id),
  }))
  const pesos = dados.arestas.map((a) => a.peso)
  const min = Math.min(...pesos)
  const max = Math.max(...pesos)
  const arestas: ArestaVisual[] = dados.arestas.map((a) => ({
    origem: a.origem,
    destino: a.destino,
    forca: max === min ? 0.5 : (a.peso - min) / (max - min),
  }))
  return { nos, arestas }
}

function ListaPanelas({ panelas, acesa, onAcender }: { panelas: Panela[]; acesa: number | null; onAcender: (i: number | null) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-2xl font-bold leading-tight">Maiores panelas</h2>
        <p className="mt-1 text-sm text-muted-foreground">Escolha uma para acender os membros no grafo.</p>
      </div>
      {panelas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma panela com 3 ou mais participantes neste recorte.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {panelas.map((p, i) => {
            const ativa = acesa === i
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => onAcender(ativa ? null : i)}
                  className={`flex min-h-11 w-full cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-[background-color,border-color] duration-150 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none ${
                    ativa ? 'border-primary bg-accent' : 'border-border'
                  }`}
                >
                  {/* a cor da panela fica sempre sobre o fundo do painel, como no grafo */}
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-grafo-fundo font-display text-lg font-bold" style={{ color: CORES_PANELA[i] }} aria-hidden>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      Panela {i + 1}: {p.tamanho} participantes
                    </span>
                    <span className="block text-[13px] leading-snug text-muted-foreground">
                      {p.participantes.map((m) => m.nome).join(', ')}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function DetalhePanelinha({
  no,
  dados,
  panelas,
  onSelecionar,
  onAcender,
  mostrarFechar = true,
}: {
  no: NoPanelinhas
  dados: PanelinhasResponse
  panelas: Panela[]
  onSelecionar: (id: string | null) => void
  onAcender: (i: number | null) => void
  mostrarFechar?: boolean
}) {
  const nomes = useMemo(() => new Map(dados.nos.map((n) => [n.id, n.nome])), [dados.nos])
  const lacos = useMemo(
    () =>
      dados.arestas
        .filter((a) => a.origem === no.id || a.destino === no.id)
        .map((a) => ({ id: a.origem === no.id ? a.destino : a.origem, peso: a.peso }))
        .sort((a, b) => b.peso - a.peso || (nomes.get(a.id) ?? '').localeCompare(nomes.get(b.id) ?? '')),
    [dados.arestas, no.id, nomes],
  )
  const minhas = panelas.map((p, i) => ({ p, i })).filter(({ p }) => p.participantes.some((m) => m.id === no.id))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl font-bold leading-tight">{no.nome}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Em {fmt(no.panelas)} {no.panelas === 1 ? 'panela' : 'panelas'} · {fmt(lacos.length)} {lacos.length === 1 ? 'ligação' : 'ligações'}
          </p>
        </div>
        {mostrarFechar && (
          <button
            type="button"
            onClick={() => onSelecionar(null)}
            className="-m-1.5 grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Fechar detalhes e voltar às panelas"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {minhas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Entre as maiores panelas</h3>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {minhas.map(({ p, i }) => (
              <button
                key={i}
                type="button"
                onClick={() => onAcender(i)}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="grid size-6 place-items-center rounded bg-grafo-fundo font-display font-bold" style={{ color: CORES_PANELA[i] }} aria-hidden>
                  {i + 1}
                </span>
                Acender panela {i + 1} ({p.tamanho})
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold">Mais acertos em comum</h3>
        {lacos.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Nenhum par atinge o limiar com este participante.</p>
        ) : (
          <ul className="mt-1.5 flex flex-col">
            {lacos.slice(0, 8).map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => onSelecionar(l.id)}
                  className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="truncate">{nomes.get(l.id) ?? l.id}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{fmt(l.peso)} jogos</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SecaoSerie({ filtros }: { filtros: FiltrosPanelinhas }) {
  const serie = useSeriePanelinhas(filtros)
  const pontos = serie.data ?? []
  // Faixa do começo: enquanto o limiar fica em 1 (ou não há pares), quase todo par vira ligação
  let fimFaixa = 0
  while (fimFaixa < pontos.length && (pontos[fimFaixa].limiar ?? 0) <= 1) fimFaixa++
  const avisos = new Set(pontos.flatMap((p, i) => (p.completou ? [] : [i])))

  return (
    <section aria-labelledby="titulo-serie" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 id="titulo-serie" className="font-display text-2xl font-bold leading-tight">Panelas ao longo da Copa</h2>
        <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
          Cada ponto usa os jogos acumulados até aquela rodada, com o mesmo limiar e recorte escolhidos acima.
        </p>
      </div>
      {serie.isLoading ? (
        <Skeleton className="h-[260px] w-full rounded-md" />
      ) : serie.isError ? (
        <p role="alert" className="text-sm text-destructive">Não foi possível carregar a série. Recarregue a página para tentar de novo.</p>
      ) : pontos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não há rodadas encerradas.</p>
      ) : (
        <>
          <GraficoLinhas
            titulo={`Tamanho da maior panela e média das 5 maiores em ${pontos.length} rodadas, em ordem de data.`}
            rotulosX={pontos.map((p) => rotuloRodadaApi(p.rodada))}
            series={[
              { rotulo: 'Maior panela', cor: 'var(--chart-1)', valores: pontos.map((p) => p.tamanhoMaximo) },
              { rotulo: 'Média das 5 maiores', cor: 'var(--chart-2)', valores: pontos.map((p) => p.tamanhoMedioTopK), tracejada: true },
            ]}
            formatar={(x) => fmt(x, Number.isInteger(x) ? 0 : 1)}
            faixaInicial={{
              fim: fimFaixa,
              nota: 'Primeiras rodadas, pouco informativas: com poucos jogos quase todo par tem 1 acerto em comum, o limiar fica em 1 e as panelas incham.',
            }}
            avisos={avisos}
          />
          {avisos.size > 0 && (
            <p className="text-sm text-destructive">
              ! = rodada em que a busca parou no limite de tempo; o valor é um mínimo.
            </p>
          )}
        </>
      )}
    </section>
  )
}
