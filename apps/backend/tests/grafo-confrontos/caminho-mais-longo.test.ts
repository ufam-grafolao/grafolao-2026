import { describe, expect, it } from 'vitest'
import { caminhoMaisLongo } from '../../src/modules/grafo-confrontos/grafo-confrontos.algoritmos.js'
import type { ConfrontoAgregado } from '../../src/modules/grafo-confrontos/grafo-confrontos.algoritmos.js'

// Aresta { vencedorId: 'A', perdedorId: 'B' } = "user1 venceu user2", desenhada A → B.
// O caminho mais longo é a maior sequência de participantes em que cada um venceu o
// seguinte, sem repetir ninguém. O resultado traz `completou`: true quando a busca
// terminou (resultado ótimo garantido) e false quando o orçamento de tempo acabou.
const aresta = (vencedorId: string, perdedorId: string): ConfrontoAgregado => ({ vencedorId, perdedorId, peso: 1 })

describe('Caminho mais longo', () => {
  it('devolve caminho vazio e completou=true para um grafo sem arestas', () => {
    const resultado = caminhoMaisLongo(['user1', 'user2'], [])

    expect(resultado.caminhoIds).toEqual([])
    expect(resultado.completou).toBe(true)
  })

  it('encontra o caminho ótimo, mesmo havendo um atalho mais curto', () => {
    // Grafo (o atalho user1 → user4 vem primeiro na lista, então o DFS o explora antes):
    //
    //   user1 ──▶ user2 ──▶ user3 ──▶ user4
    //     └────────────────────────────▲
    //
    // Resultado à mão: o ótimo é user1, user2, user3, user4 (4 participantes, 3 arestas).
    // O atalho user1 → user4 gera apenas um caminho de 2 participantes.
    const vertices = ['user1', 'user2', 'user3', 'user4']
    const arestas = [
      aresta('user1', 'user4'),
      aresta('user1', 'user2'),
      aresta('user2', 'user3'),
      aresta('user3', 'user4'),
    ]

    const resultado = caminhoMaisLongo(vertices, arestas)

    expect(resultado.caminhoIds).toEqual(['user1', 'user2', 'user3', 'user4'])
    expect(resultado.completou).toBe(true)
  })

  it('não repete participantes quando há um ciclo', () => {
    // Grafo: user1 → user2 → user3 → user1.
    // Resultado à mão: o maior caminho simples tem 3 participantes (um a menos que
    // "dar a volta"), por exemplo user1, user2, user3.
    const arestas = [aresta('user1', 'user2'), aresta('user2', 'user3'), aresta('user3', 'user1')]

    const resultado = caminhoMaisLongo(['user1', 'user2', 'user3'], arestas)

    expect(resultado.caminhoIds).toHaveLength(3)
    expect(new Set(resultado.caminhoIds).size).toBe(3)
    expect(resultado.completou).toBe(true)
  })

  it('devolve completou=false quando o orçamento de tempo já está esgotado', () => {
    // Por que orçamento -1 ms: o código compara (tempo gasto > orçamento). Com -1 a
    // comparação é verdadeira desde a primeira chamada, sem depender da velocidade da
    // máquina nem de relógio simulado. É o "orçamento mínimo" determinístico.
    //
    // Mesmo grafo do teste do ótimo (que teria 4 participantes se a busca rodasse).
    const vertices = ['user1', 'user2', 'user3', 'user4']
    const arestas = [aresta('user1', 'user2'), aresta('user2', 'user3'), aresta('user3', 'user4')]

    const resultado = caminhoMaisLongo(vertices, arestas, -1)

    expect(resultado.completou).toBe(false)
    expect(resultado.caminhoIds.length).toBeLessThan(4)
  })
})
