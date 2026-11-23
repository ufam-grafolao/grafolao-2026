import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import type { NodeLabelDrawingFunction, NodeHoverDrawingFunction } from 'sigma/rendering'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { NoGrafo, ArestaGrafo } from '@/types/grafo-confrontos'
import { ControlesGrafo, LegendaGrafo, MarcaNo, MarcaSeta, MarcaTamanho } from '@/components/grafo/painel-grafo'
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

const TOP_DESTAQUE = 5
const TOP_ROTULO = 10
const RAIO_MAX = 17 // painel largo; em painéis estreitos (celular) o máximo cai para 11
const RAIO_MIN_VISIVEL = 3

export interface GrafoCanvasHandle {
  focar: (noId: string) => void
  aproximar: () => void
  afastar: () => void
  centralizar: () => void
}

interface GrafoCanvasProps {
  nos: NoGrafo[]
  arestas: ArestaGrafo[]
  selecionadoId?: string | null
  onSelecionarNo: (no: NoGrafo | null) => void
  ref?: Ref<GrafoCanvasHandle>
}

// ─── desenho dos rótulos: texto claro com contorno da cor do painel, legível sobre as arestas
const desenharRotulo: NodeLabelDrawingFunction = (ctx, data, settings) => {
  if (!data.label) return
  const tamanho = settings.labelSize
  ctx.font = `${settings.labelWeight} ${tamanho}px ${settings.labelFont}`
  const largura = ctx.measureText(data.label).width
  const limite = ctx.canvas.clientWidth || ctx.canvas.width
  const cabe = data.x + data.size + 5 + largura <= limite - 4
  const x = cabe ? data.x + data.size + 5 : data.x - data.size - 5 - largura
  const y = data.y + tamanho / 3
  ctx.lineJoin = 'round'
  ctx.lineWidth = 4
  ctx.strokeStyle = COR.rotuloContorno
  ctx.strokeText(data.label, x, y)
  ctx.fillStyle = COR.rotulo
  ctx.fillText(data.label, x, y)
}

// Foco: anel claro em volta do nó + rótulo em pílula de vidro escuro.
// Desenha só o nó marcado como `highlighted` pelo nosso estado de foco: o Sigma 3.0.3 não limpa
// o nó em hover quando o mouse sai do canvas, e o anel ficaria preso.
const desenharHover: NodeHoverDrawingFunction = (ctx, data, settings) => {
  if (!data.highlighted) return
  ctx.beginPath()
  ctx.arc(data.x, data.y, data.size + 3, 0, Math.PI * 2)
  ctx.lineWidth = 2
  ctx.strokeStyle = COR.rotulo
  ctx.stroke()
  if (!data.label) return
  const tamanho = settings.labelSize + 1
  ctx.font = `700 ${tamanho}px ${settings.labelFont}`
  const largura = ctx.measureText(data.label).width
  const limite = ctx.canvas.clientWidth || ctx.canvas.width
  const cabe = data.x + data.size + 14 + largura <= limite - 4
  const x = cabe ? data.x + data.size + 8 : data.x - data.size - 8 - largura
  const y = data.y
  const altura = tamanho + 10
  ctx.fillStyle = COR.pilula
  ctx.strokeStyle = COR.pilulaBorda
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(x - 6, y - altura / 2, largura + 12, altura, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = COR.rotulo
  ctx.fillText(data.label, x, y + tamanho / 3)
}

export function GrafoCanvas({ nos, arestas, selecionadoId = null, onSelecionarNo, ref }: GrafoCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const atualizarFocoRef = useRef<() => void>(() => {})
  const selecionadoRef = useRef<string | null>(selecionadoId)
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

  // Seleção vinda da página (busca, Top 5, painel): só redesenha, não reconstrói o grafo
  useEffect(() => {
    selecionadoRef.current = selecionadoId
    atualizarFocoRef.current()
  }, [selecionadoId])

  useEffect(() => {
    if (!containerRef.current || nos.length === 0) return

    const graph = new Graph({ type: 'directed', multi: false })
    const maxPR = Math.max(...nos.map((n) => n.pageRank))
    const estreito = (containerRef.current.clientWidth || 800) < 560 // celular
    const raioMax = estreito ? 11 : RAIO_MAX
    const topRotulo = estreito ? TOP_DESTAQUE : TOP_ROTULO // no celular, só o top 5 tem rótulo fixo
    const angulo = Math.PI * (3 - Math.sqrt(5)) // espiral de ouro: posição inicial determinística

    nos.forEach((no, i) => {
      // área ∝ PageRank → raio ∝ √PageRank
      const raio = Math.max(RAIO_MIN_VISIVEL, raioMax * Math.sqrt(no.pageRank / maxPR))
      graph.addNode(no.id, {
        label: no.nome,
        size: raio,
        color: no.posicao <= TOP_DESTAQUE ? COR.noDestaque : COR.no,
        forceLabel: no.posicao <= topRotulo,
        zIndex: no.posicao <= TOP_DESTAQUE ? 1 : 0,
        x: Math.sqrt(i + 1) * Math.cos(i * angulo),
        y: Math.sqrt(i + 1) * Math.sin(i * angulo),
      })
    })

    const pesos = arestas.map((a) => a.peso)
    const minPeso = Math.min(...pesos, 1)
    const maxPeso = Math.max(...pesos, 1)
    for (const a of arestas) {
      if (!graph.hasNode(a.origem) || !graph.hasNode(a.destino)) continue
      const chave = `${a.origem}->${a.destino}`
      if (graph.hasEdge(chave)) continue
      const t = maxPeso === minPeso ? 0.5 : (a.peso - minPeso) / (maxPeso - minPeso)
      graph.addEdgeWithKey(chave, a.origem, a.destino, { size: 0.6, peso: a.peso, forca: t, type: 'arrow' })
    }

    forceAtlas2.assign(graph, {
      iterations: 400,
      settings: { ...forceAtlas2.inferSettings(graph), adjustSizes: true, gravity: 1.2, scalingRatio: 6, slowDown: 2 },
    })

    // ─── estado de foco (fora do React, para animar sem re-renderizar)
    let hover: string | null = null
    let mostrado: string | null = null // nó cujo destaque está na tela
    let vizinhos = new Set<string>()
    let intensidade = 0 // 0 = repouso, 1 = foco completo
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
      }
    }

    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultEdgeType: 'arrow',
      zIndex: true,
      labelFont: FONTE,
      labelSize: 13,
      labelWeight: '600',
      labelColor: { color: COR.rotulo },
      labelRenderedSizeThreshold: Number.POSITIVE_INFINITY, // só rótulos forçados (top 10 e foco)
      defaultDrawNodeLabel: desenharRotulo,
      defaultDrawNodeHover: desenharHover,
      minCameraRatio: 0.12,
      maxCameraRatio: 3,
      stagePadding: estreito ? 56 : 36, // folga para os controles flutuantes
      nodeReducer: (node, data) => {
        if (!mostrado || intensidade === 0) return { ...data, highlighted: false }
        if (node === mostrado) return { ...data, highlighted: intensidade > 0.5, forceLabel: true, zIndex: 3, size: data.size * (1 + 0.15 * intensidade) }
        if (vizinhos.has(node)) return { ...data, zIndex: 2 }
        const cor = misturar(data.color.startsWith('#') ? data.color : COR.no, COR.esmaecido, intensidade * 0.85)
        return { ...data, color: cor, zIndex: 0, forceLabel: intensidade < 0.5 ? data.forceLabel : false }
      },
      edgeReducer: (edge, data) => {
        const forca = (graph.getEdgeAttribute(edge, 'forca') as number) ?? 0.5
        if (!mostrado || intensidade === 0) return { ...data, color: sobreFundo(COR.arestaRepouso, 0.07 + 0.06 * forca) }
        const [origem, destino] = graph.extremities(edge)
        if (origem === mostrado || destino === mostrado) {
          const base = origem === mostrado ? COR.vitoria : COR.derrota
          const alfa = (0.45 + 0.5 * forca) * intensidade + 0.1 * (1 - intensidade)
          return { ...data, color: sobreFundo(base, alfa), size: 0.6 + 1.2 * intensidade, zIndex: 1 }
        }
        return { ...data, color: sobreFundo(COR.arestaRepouso, (0.07 + 0.06 * forca) * (1 - 0.7 * intensidade)) }
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
    renderer.on('clickNode', ({ node }) => {
      onSelecionarRef.current(nos.find((n) => n.id === node) ?? null)
    })
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
      <div
        ref={containerRef}
        className="h-full w-full"
        role="img"
        aria-label={`Grafo de confrontos com ${nos.length} participantes e ${arestas.length} confrontos. Use a busca ou a lista ao lado para explorar por teclado.`}
      />
      <ControlesGrafo onAproximar={aproximar} onAfastar={afastar} onCentralizar={centralizar} alvoTelaCheia={wrapperRef} />
      <LegendaGrafo
        dica="Passe o mouse ou toque num participante."
        itens={[
          { marca: <MarcaNo cor={COR.noDestaque} />, texto: <><span className="text-grafo-texto">Top 5</span> do PageRank</> },
          { marca: <MarcaTamanho />, texto: 'Tamanho do nó = PageRank' },
          { marca: <MarcaSeta cor={COR.vitoria} />, texto: <><span className="text-grafo-texto">Venceu:</span> seta sai do participante</> },
          { marca: <MarcaSeta cor={COR.derrota} />, texto: <><span className="text-grafo-texto">Perdeu:</span> seta chega nele</> },
        ]}
      />
    </div>
  )
}
