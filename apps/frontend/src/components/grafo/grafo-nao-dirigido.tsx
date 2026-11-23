import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { ControlesGrafo, LegendaGrafo, type ItemLegenda } from '@/components/grafo/painel-grafo'
import { desenharHover, desenharRotulo } from '@/lib/sigma-desenho'
import {
  COR_GRAFO as COR,
  DURACAO_CAMERA_MS,
  DURACAO_FOCO_MS,
  FONTE_ROTULO as FONTE,
  easeOutForte,
  misturar,
  molaCritica,
  movimentoReduzido,
  sobreFundo,
} from '@/lib/grafo-visual'

const RAIO_MAX = 15 // painel largo; no celular cai para 10
const RAIO_MIN = 3

export interface NoVisual {
  id: string
  rotulo: string
  /** 0–1: o raio cresce com a raiz (área proporcional) */
  tamanho: number
  /** cor em repouso; padrão: COR_GRAFO.no */
  cor?: string
  /** rótulo sempre visível (ex.: top 5) */
  fixarRotulo?: boolean
}

export interface ArestaVisual {
  origem: string
  destino: string
  /** 0–1: quanto mais forte, mais visível e (no layout) mais curta */
  forca: number
}

export interface GrupoAceso {
  membros: Set<string>
  cor: string
}

export interface GrafoNaoDirigidoHandle {
  focar: (noId: string) => void
  aproximar: () => void
  afastar: () => void
  centralizar: () => void
}

interface Props {
  nos: NoVisual[]
  arestas: ArestaVisual[]
  /** Descrição curta para leitores de tela (o grafo em si é uma imagem) */
  descricao: string
  legenda: ItemLegenda[]
  dicaLegenda?: string
  selecionadoId?: string | null
  /** Grupo destacado (ex.: uma panela): membros acesos, o resto esmaecido */
  grupo?: GrupoAceso | null
  onSelecionarNo: (id: string | null) => void
  ref?: Ref<GrafoNaoDirigidoHandle>
}

/**
 * Grafo não dirigido no painel escuro, com a mesma linguagem do Grafo de Confrontos:
 * foco no nó acende os vizinhos, o resto esmaece; um grupo pode ficar aceso por cima.
 */
export function GrafoNaoDirigido({
  nos,
  arestas,
  descricao,
  legenda,
  dicaLegenda = 'Passe o mouse ou toque num participante.',
  selecionadoId = null,
  grupo = null,
  onSelecionarNo,
  ref,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const atualizarFocoRef = useRef<() => void>(() => {})
  const selecionadoRef = useRef<string | null>(selecionadoId)
  const grupoRef = useRef<GrupoAceso | null>(grupo)
  const onSelecionarRef = useRef(onSelecionarNo)

  useEffect(() => {
    onSelecionarRef.current = onSelecionarNo
  }, [onSelecionarNo])

  const aproximar = () => sigmaRef.current?.getCamera().animatedZoom({ duration: movimentoReduzido() ? 0 : 250, factor: 1.6 })
  const afastar = () => sigmaRef.current?.getCamera().animatedUnzoom({ duration: movimentoReduzido() ? 0 : 250, factor: 1.6 })
  const centralizar = () =>
    sigmaRef.current?.getCamera().animatedReset({ duration: movimentoReduzido() ? 0 : DURACAO_CAMERA_MS, easing: molaCritica })

  useImperativeHandle(ref, () => ({
    aproximar,
    afastar,
    centralizar,
    focar(noId) {
      const renderer = sigmaRef.current
      const pos = renderer?.getNodeDisplayData(noId)
      if (!renderer || !pos) return
      const camera = renderer.getCamera()
      camera.animate(
        { x: pos.x, y: pos.y, ratio: Math.min(camera.ratio, 0.55) },
        { duration: movimentoReduzido() ? 0 : DURACAO_CAMERA_MS, easing: molaCritica },
      )
    },
  }))

  // Seleção e grupo vindos da página: só redesenham, não reconstroem o grafo
  useEffect(() => {
    selecionadoRef.current = selecionadoId
    grupoRef.current = grupo
    atualizarFocoRef.current()
  }, [selecionadoId, grupo])

  useEffect(() => {
    if (!containerRef.current || nos.length === 0) return

    const graph = new Graph({ type: 'undirected', multi: false })
    const estreito = (containerRef.current.clientWidth || 800) < 560
    const raioMax = estreito ? 10 : RAIO_MAX
    const angulo = Math.PI * (3 - Math.sqrt(5)) // espiral de ouro: posição inicial determinística

    nos.forEach((no, i) => {
      graph.addNode(no.id, {
        label: no.rotulo,
        size: Math.max(RAIO_MIN, raioMax * Math.sqrt(Math.min(1, Math.max(0, no.tamanho)))),
        color: no.cor ?? COR.no,
        corBase: no.cor ?? COR.no,
        forceLabel: !!no.fixarRotulo,
        zIndex: no.fixarRotulo ? 1 : 0,
        x: Math.sqrt(i + 1) * Math.cos(i * angulo),
        y: Math.sqrt(i + 1) * Math.sin(i * angulo),
      })
    })

    for (const a of arestas) {
      if (a.origem === a.destino || !graph.hasNode(a.origem) || !graph.hasNode(a.destino)) continue
      if (graph.hasEdge(a.origem, a.destino)) continue
      const forca = Math.min(1, Math.max(0, a.forca))
      // weight = atração no ForceAtlas2: aresta forte puxa mais e fica mais curta
      graph.addEdge(a.origem, a.destino, { size: 0.8, forca, weight: 0.15 + forca })
    }

    if (graph.size > 0) {
      forceAtlas2.assign(graph, {
        iterations: 400, // o atributo `weight` da aresta é lido por padrão
        settings: {
          ...forceAtlas2.inferSettings(graph),
          adjustSizes: true,
          edgeWeightInfluence: 1,
          gravity: 1.2,
          scalingRatio: 6,
          slowDown: 2,
        },
      })
    }

    // ─── estado de foco (fora do React, para animar sem re-renderizar)
    let hover: string | null = null
    let mostrado: string | null = null
    let vizinhos = new Set<string>()
    let intensidade = 0
    let quadro = 0

    const calcularVizinhos = (no: string) => {
      const s = new Set<string>([no])
      graph.forEachNeighbor(no, (v) => s.add(v))
      return s
    }

    const animarPara = (alvo: number, aoTerminar?: () => void) => {
      cancelAnimationFrame(quadro)
      const inicio = intensidade
      const duracao = movimentoReduzido() ? 100 : DURACAO_FOCO_MS
      const t0 = performance.now()
      const passo = (agora: number) => {
        const t = Math.min(1, (agora - t0) / duracao)
        intensidade = inicio + (alvo - inicio) * easeOutForte(t)
        renderer.refresh({ skipIndexation: true })
        if (t < 1) quadro = requestAnimationFrame(passo)
        else aoTerminar?.()
      }
      quadro = requestAnimationFrame(passo)
    }

    const atualizarFoco = () => {
      const alvo = hover ?? selecionadoRef.current
      if (alvo && graph.hasNode(alvo)) {
        if (alvo !== mostrado) {
          mostrado = alvo
          vizinhos = calcularVizinhos(alvo)
        }
        if (intensidade < 1) animarPara(1)
        else renderer.refresh({ skipIndexation: true })
      } else if (mostrado) {
        animarPara(0, () => {
          mostrado = null
          vizinhos = new Set()
          renderer.refresh({ skipIndexation: true })
        })
      } else {
        renderer.refresh({ skipIndexation: true })
      }
    }

    const corAresta = (forca: number) => sobreFundo(COR.arestaRepouso, 0.08 + 0.12 * forca)

    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      zIndex: true,
      labelFont: FONTE,
      labelSize: 13,
      labelWeight: '600',
      labelColor: { color: COR.rotulo },
      labelRenderedSizeThreshold: Number.POSITIVE_INFINITY, // só rótulos fixados e o foco
      defaultDrawNodeLabel: desenharRotulo,
      defaultDrawNodeHover: desenharHover,
      minCameraRatio: 0.12,
      maxCameraRatio: 3,
      stagePadding: estreito ? 56 : 36,
      allowInvalidContainer: true, // painel oculto ou redimensionando (tela cheia, captura) não derruba a página
      nodeReducer: (node, data) => {
        const g = grupoRef.current
        const base = (data.corBase as string) ?? COR.no
        // 1) foco num nó vence o grupo
        if (mostrado && intensidade > 0) {
          if (node === mostrado) return { ...data, highlighted: intensidade > 0.5, forceLabel: true, zIndex: 3, size: data.size * (1 + 0.15 * intensidade) }
          if (vizinhos.has(node)) return { ...data, highlighted: false, zIndex: 2 }
          return { ...data, highlighted: false, color: misturar(base, COR.esmaecido, intensidade * 0.85), zIndex: 0, forceLabel: intensidade < 0.5 ? data.forceLabel : false }
        }
        // 2) grupo aceso: membros na cor do grupo e com rótulo; o resto esmaece
        if (g) {
          if (g.membros.has(node)) return { ...data, highlighted: false, color: g.cor, forceLabel: !estreito || data.forceLabel, zIndex: 2 }
          return { ...data, highlighted: false, color: misturar(base, COR.esmaecido, 0.85), forceLabel: false, zIndex: 0 }
        }
        return { ...data, highlighted: false }
      },
      edgeReducer: (edge, data) => {
        const forca = (data.forca as number) ?? 0.5
        const [a, b] = graph.extremities(edge)
        if (mostrado && intensidade > 0) {
          if (a === mostrado || b === mostrado) {
            const alfa = (0.4 + 0.5 * forca) * intensidade + 0.1 * (1 - intensidade)
            return { ...data, color: sobreFundo(COR.rotulo, alfa), size: 0.8 + 1.2 * intensidade, zIndex: 1 }
          }
          return { ...data, color: sobreFundo(COR.arestaRepouso, (0.08 + 0.12 * forca) * (1 - 0.7 * intensidade)) }
        }
        const g = grupoRef.current
        if (g) {
          if (g.membros.has(a) && g.membros.has(b)) return { ...data, color: sobreFundo(g.cor, 0.75), size: 1.6, zIndex: 1 }
          return { ...data, color: sobreFundo(COR.arestaRepouso, 0.04) }
        }
        return { ...data, color: corAresta(forca) }
      },
    })
    sigmaRef.current = renderer
    atualizarFocoRef.current = atualizarFoco

    renderer.on('enterNode', ({ node }) => {
      hover = node
      atualizarFoco()
      containerRef.current?.style.setProperty('cursor', 'pointer')
    })
    renderer.on('leaveNode', () => {
      hover = null
      atualizarFoco()
      containerRef.current?.style.removeProperty('cursor')
    })
    renderer.on('clickNode', ({ node }) => onSelecionarRef.current(node))
    renderer.on('clickStage', () => {
      hover = null // no toque o "hover" sintético fica preso; tocar no fundo limpa tudo
      onSelecionarRef.current(null)
      atualizarFoco()
    })

    atualizarFoco()

    return () => {
      cancelAnimationFrame(quadro)
      atualizarFocoRef.current = () => {}
      sigmaRef.current = null
      renderer.kill()
    }
  }, [nos, arestas])

  return (
    <div ref={wrapperRef} className="relative h-full w-full bg-grafo-fundo" data-grafo-canvas>
      <div ref={containerRef} className="h-full w-full" role="img" aria-label={descricao} />
      <ControlesGrafo onAproximar={aproximar} onAfastar={afastar} onCentralizar={centralizar} alvoTelaCheia={wrapperRef} />
      <LegendaGrafo itens={legenda} dica={dicaLegenda} />
    </div>
  )
}
