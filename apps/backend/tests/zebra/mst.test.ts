import { describe, expect, it } from 'vitest'
import { mstDoJogo, mstKruskal } from '../../src/modules/zebra/zebra.algoritmos.js'

// MST (árvore geradora mínima) por Kruskal. Desempate determinístico: arestas ordenadas
// por (peso, menor id, maior id). O peso total não depende do desempate.
const palpite = (usuarioId: string, golsCasa: number, golsVisitante: number) => ({ usuarioId, golsCasa, golsVisitante })
const e = (a: string, b: string, peso: number) => ({ a, b, peso })

describe('MST por Kruskal', () => {
  it('grafo vazio não tem arestas', () => {
    expect(mstKruskal([], [])).toEqual({ arestas: [], pesoTotal: 0, componentes: 0 })
  })

  it('escolhe as arestas mais leves sem fechar ciclo', () => {
    // Triângulo: 1-2 (1), 2-3 (2), 1-3 (3). Resultado à mão: 1-2 e 2-3, peso 3.
    const r = mstKruskal(['user1', 'user2', 'user3'], [e('user1', 'user2', 1), e('user2', 'user3', 2), e('user1', 'user3', 3)])

    expect(r.arestas).toEqual([e('user1', 'user2', 1), e('user2', 'user3', 2)])
    expect(r.pesoTotal).toBe(3)
    expect(r.componentes).toBe(1)
  })

  it('desempata pesos iguais pelos ids, sempre da mesma forma', () => {
    // Triângulo com os três pesos iguais: qualquer par de arestas é uma MST.
    // Desempate por id: (user1,user2), depois (user1,user3). (user2,user3) fecharia ciclo.
    const arestas = [e('user2', 'user3', 1), e('user3', 'user1', 1), e('user1', 'user2', 1)]

    const r = mstKruskal(['user1', 'user2', 'user3'], arestas)

    expect(r.arestas).toEqual([e('user1', 'user2', 1), e('user1', 'user3', 1)])
  })

  it('em grafo desconexo devolve uma floresta e conta os componentes', () => {
    // {1,2} ligados, 3 isolado. Resultado à mão: 1 aresta, 2 componentes.
    const r = mstKruskal(['user1', 'user2', 'user3'], [e('user1', 'user2', 0.5)])

    expect(r.arestas).toHaveLength(1)
    expect(r.componentes).toBe(2)
  })
})

describe('MST de um jogo', () => {
  it('liga placares iguais com 0, resultados iguais com 0,5 e resultados diferentes com 1', () => {
    // user1 2×1, user2 2×1, user3 1×0, user4 0×0.
    // Distâncias: 1-2=0, 1-3=0,5, 2-3=0,5, 1-4=1, 2-4=1, 3-4=1.
    // Kruskal: 1-2 (0), 1-3 (0,5), pula 2-3 (ciclo), 1-4 (1). Peso total 1,5.
    const r = mstDoJogo([palpite('user1', 2, 1), palpite('user2', 2, 1), palpite('user3', 1, 0), palpite('user4', 0, 0)])

    expect(r.arestas).toEqual([e('user1', 'user2', 0), e('user1', 'user3', 0.5), e('user1', 'user4', 1)])
    expect(r.pesoTotal).toBe(1.5)
  })

  it('o peso total depende só de quantos placares e resultados distintos houve', () => {
    // Por que: em qualquer MST com distâncias 0 / 0,5 / 1 há
    //   (resultados distintos − 1) arestas de peso 1 e
    //   (placares distintos − resultados distintos) arestas de peso 0,5.
    // Aqui: placares {2×1, 3×0, 1×1, 0×0, 0×2} = 5; resultados {CASA, EMPATE, VISITANTE} = 3.
    // Resultado à mão: 2 × 1 + 2 × 0,5 = 3, seja qual for a ordem de entrada.
    const palpites = [
      palpite('user1', 2, 1), palpite('user2', 3, 0), palpite('user3', 1, 1),
      palpite('user4', 0, 0), palpite('user5', 0, 2), palpite('user6', 2, 1),
    ]

    expect(mstDoJogo(palpites).pesoTotal).toBe(3)
    expect(mstDoJogo([...palpites].reverse()).pesoTotal).toBe(3)
  })

  it('a MST escolhida não muda com a ordem dos palpites', () => {
    const palpites = [palpite('user3', 1, 0), palpite('user1', 2, 1), palpite('user2', 2, 1)]

    expect(mstDoJogo(palpites).arestas).toEqual(mstDoJogo([...palpites].reverse()).arestas)
  })
})
