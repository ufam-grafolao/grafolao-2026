import { useEffect, useRef } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { NoGrafo, ArestaGrafo } from '@/types/grafo-confrontos'

interface GrafoCanvasProps {
  nos: NoGrafo[]
  arestas: ArestaGrafo[]
  onSelecionarNo: (no: NoGrafo | null) => void
}

const COR_BASE = '#94a3b8'
const COR_DESTAQUE = '#f59e0b'
const COR_ARESTA = '#cbd5e1'
const COR_ARESTA_DESTAQUE = '#3b82f6'
const COR_APAGADO_NO = '#e2e8f0'
const COR_APAGADO_ARESTA = '#f1f5f9'

function escalaLinear(valor: number, min: number, max: number, novoMin: number, novoMax: number) {
  if (max === min) return (novoMin + novoMax) / 2
  return novoMin + ((valor - min) / (max - min)) * (novoMax - novoMin)
}

export function GrafoCanvas({ nos, arestas, onSelecionarNo }: GrafoCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || nos.length === 0) return

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
        size: escalaLinear(aresta.peso, minPeso, maxPeso, 0.5, 3),
        color: COR_ARESTA,
      })
    }

    forceAtlas2.assign(graph, {
      iterations: 150,
      settings: forceAtlas2.inferSettings(graph),
    })

    let nodeEmFoco: string | null = null

    const renderer = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      labelRenderedSizeThreshold: 8,
      defaultNodeColor: COR_BASE,
      defaultEdgeColor: COR_ARESTA,
      nodeReducer: (node, data) => {
        if (!nodeEmFoco) return data
        const destaque = node === nodeEmFoco || graph.areNeighbors(node, nodeEmFoco)
        return destaque ? data : { ...data, color: COR_APAGADO_NO, label: '' }
      },
      edgeReducer: (edge, data) => {
        if (!nodeEmFoco) return data
        const tocaFoco = graph.extremities(edge).includes(nodeEmFoco)
        return tocaFoco
          ? { ...data, color: COR_ARESTA_DESTAQUE, size: (data.size as number) + 1 }
          : { ...data, color: COR_APAGADO_ARESTA }
      },
    })

    renderer.on('enterNode', ({ node }) => { nodeEmFoco = node; renderer.refresh() })
    renderer.on('leaveNode', () => { nodeEmFoco = null; renderer.refresh() })
    renderer.on('clickNode', ({ node }) => {
      onSelecionarNo(nos.find(n => n.id === node) ?? null)
    })
    renderer.on('clickStage', () => onSelecionarNo(null))

    return () => {
      renderer.kill()
    }
  }, [nos, arestas, onSelecionarNo])

  return <div ref={containerRef} className="h-full w-full" />
}