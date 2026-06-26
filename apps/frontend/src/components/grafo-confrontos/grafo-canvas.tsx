import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import Graph from 'graphology'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { NoGrafo, ArestaGrafo } from '@/types/grafo-confrontos'
import { Maximize2, Minimize2 } from 'lucide-react'

interface GrafoCanvasProps {
  nos: NoGrafo[]
  arestas: ArestaGrafo[]
  onSelecionarNo: (no: NoGrafo | null) => void
}

const COR_BASE = '#94a3b8'
const COR_DESTAQUE = '#f59e0b'
const COR_VITORIA = '#3b82f6'
const COR_DERROTA = '#f43f5e'

const LIMITE_VITORIAS_HOVER = 20
const LIMITE_DERROTAS_HOVER = 3

function escalaLinear(valor: number, min: number, max: number, novoMin: number, novoMax: number) {
  if (max === min) return (novoMin + novoMax) / 2
  return novoMin + ((valor - min) / (max - min)) * (novoMax - novoMin)
}

function lerpRgb(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

function corPorPeso(peso: number, minPeso: number, maxPeso: number): string {
  const t = maxPeso === minPeso ? 0.5 : (peso - minPeso) / (maxPeso - minPeso)
  const r = lerpRgb(148, 59, t)
  const g = lerpRgb(163, 130, t)
  const b = lerpRgb(184, 246, t)
  const alpha = escalaLinear(t, 0, 1, 0.12, 0.65)
  return `rgba(${r},${g},${b},${alpha})`
}

export function GrafoCanvas({ nos, arestas, onSelecionarNo }: GrafoCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef    = useRef<HTMLDivElement>(null)
  const legendaRef    = useRef<HTMLDivElement>(null)
  const [telaCheia, setTelaCheia] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    const onMudanca = () => setTelaCheia(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onMudanca)
    return () => document.removeEventListener('fullscreenchange', onMudanca)
  }, [])

  function toggleTelaCheia() {
    if (!document.fullscreenElement) wrapperRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  useEffect(() => {
    if (!containerRef.current || nos.length === 0) return

    const COR_APAGADO_NO = isDark ? '#334155' : '#e2e8f0'
    const COR_LABEL      = isDark ? '#f1f5f9' : '#1e293b'
    const COR_ARESTA_PAD = isDark ? 'rgba(148,163,184,0.3)' : 'rgba(148,163,184,0.2)'

    const graph = new Graph({ type: 'directed', multi: false })

    const pageRanks = nos.map(n => n.pageRank)
    const minPR = Math.min(...pageRanks)
    const maxPR = Math.max(...pageRanks)
    const limiteDestaque = Math.max(5, Math.ceil(nos.length * 0.1))

    for (const no of nos) {
      graph.addNode(no.id, {
        label: no.nome,
        size: escalaLinear(no.pageRank, minPR, maxPR, 5, 22),
        color: no.posicao <= limiteDestaque ? COR_DESTAQUE : COR_BASE,
        x: Math.random(),
        y: Math.random(),
      })
    }

    const pesos = arestas.map(a => a.peso)
    const minPeso = Math.min(...pesos, 1)
    const maxPeso = Math.max(...pesos, 1)

    for (const aresta of arestas) {
      if (!graph.hasNode(aresta.origem) || !graph.hasNode(aresta.destino)) continue
      const chave = `${aresta.origem}->${aresta.destino}`
      if (graph.hasEdge(chave)) continue
      graph.addEdgeWithKey(chave, aresta.origem, aresta.destino, {
        size: escalaLinear(aresta.peso, minPeso, maxPeso, 0.5, 2),
        color: corPorPeso(aresta.peso, minPeso, maxPeso),
        peso: aresta.peso,
        type: 'arrow',
      })
    }

    forceAtlas2.assign(graph, {
      iterations: 150,
      settings: forceAtlas2.inferSettings(graph),
    })

    let nodeEmFoco: string | null = null
    let arestasFoco: Set<string> = new Set()
    let nosFoco: Set<string> = new Set()

    function porPesoDesc(a: string, b: string) {
      return (graph.getEdgeAttribute(b, 'peso') as number) - (graph.getEdgeAttribute(a, 'peso') as number)
    }

    function focar(node: string) {
      nodeEmFoco = node

      const vitorias = [...graph.outEdges(node)].sort(porPesoDesc)
      const derrotas = [...graph.inEdges(node)].sort(porPesoDesc)

      const vitoriasDestaque = vitorias.slice(0, LIMITE_VITORIAS_HOVER)
      const derrotasDestaque = derrotas.slice(0, LIMITE_DERROTAS_HOVER)
      arestasFoco = new Set([...vitoriasDestaque, ...derrotasDestaque])

      nosFoco = new Set([node])
      for (const e of arestasFoco) {
        const [a, b] = graph.extremities(e)
        nosFoco.add(a)
        nosFoco.add(b)
      }

      if (legendaRef.current) {
        const totalRelacoes = vitorias.length + derrotas.length
        legendaRef.current.textContent =
          `Mostrando ${arestasFoco.size} de ${totalRelacoes} confrontos (maior peso) — veja a lista completa no painel →`
        legendaRef.current.style.display = totalRelacoes > arestasFoco.size ? 'block' : 'none'
      }
    }

    function desfocar() {
      nodeEmFoco = null
      arestasFoco = new Set()
      nosFoco = new Set()
      if (legendaRef.current) legendaRef.current.style.display = 'none'
    }

    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      labelRenderedSizeThreshold: 13,
      defaultNodeColor: COR_BASE,
      defaultEdgeColor: COR_ARESTA_PAD,
      defaultEdgeType: 'arrow',
      labelColor: { color: COR_LABEL },
      nodeReducer: (node, data) => {
        if (!nodeEmFoco) return data
        if (node === nodeEmFoco) return { ...data, size: (data.size as number) * 1.4, zIndex: 2 }
        if (nosFoco.has(node)) return { ...data, size: (data.size as number) * 1.15, zIndex: 1 }
        return { ...data, color: COR_APAGADO_NO, label: '', hidden: true }
      },
      edgeReducer: (edge, data) => {
        if (!nodeEmFoco) return { ...data, hidden: true }
        if (!arestasFoco.has(edge)) return { ...data, hidden: true }
        const [src] = graph.extremities(edge)
        const cor = src === nodeEmFoco ? COR_VITORIA : COR_DERROTA
        return { ...data, color: cor, size: Math.max(data.size as number, 2) + 2, zIndex: 1 }
      },
    })

    renderer.on('enterNode', ({ node }) => { focar(node); renderer.refresh() })
    renderer.on('leaveNode', () => { desfocar(); renderer.refresh() })
    renderer.on('clickNode', ({ node }) => {
      onSelecionarNo(nos.find(n => n.id === node) ?? null)
    })
    renderer.on('clickStage', () => onSelecionarNo(null))

    return () => {
      renderer.kill()
    }
  }, [nos, arestas, onSelecionarNo, isDark])

  return (
    <div ref={wrapperRef} className="relative h-full w-full bg-card">
      <div ref={containerRef} className="h-full w-full" />

      <button
        onClick={toggleTelaCheia}
        title={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
        className="cursor-pointer absolute top-2 right-2 z-10 rounded-md bg-card/80 backdrop-blur-sm border border-border p-1.5 text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
      >
        {telaCheia ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>

      <div
        ref={legendaRef}
        style={{ display: 'none' }}
        className="absolute bottom-2 left-2 right-10 text-xs text-muted-foreground bg-card/90 backdrop-blur-sm rounded-md px-2 py-1 pointer-events-none"
      />
    </div>
  )
}