import { describe, expect, it } from 'vitest'
import { detectarCiclos } from '../../src/modules/grafo-confrontos/grafo-confrontos.algoritmos.js'
import type { ConfrontoAgregado } from '../../src/modules/grafo-confrontos/grafo-confrontos.algoritmos.js'

// Aresta { vencedorId: 'A', perdedorId: 'B' } = "user1 venceu user2", desenhada A → B.
// Um ciclo é "A venceu B, B venceu C, C venceu A": ninguém é claramente o melhor.
// O código só reporta ciclos com 3 ou mais participantes.
const aresta = (vencedorId: string, perdedorId: string): ConfrontoAgregado => ({ vencedorId, perdedorId, peso: 1 })
const conjunto = (ciclo: { participantesIds: string[] }) => [...ciclo.participantesIds].sort()

describe('Detecção de ciclos', () => {
  it('não encontra ciclos num grafo vazio', () => {
    expect(detectarCiclos([], [])).toEqual([])
  })

  it('não encontra ciclos num ranking totalmente ordenado', () => {
    // Grafo: user1 → user2 → user3 e user1 → user3 (torneio transitivo, sem volta).
    // Resultado à mão: nenhum caminho volta ao ponto de partida, então 0 ciclos.
    const vertices = ['user1', 'user2', 'user3']
    const arestas = [aresta('user1', 'user2'), aresta('user2', 'user3'), aresta('user1', 'user3')]

    expect(detectarCiclos(vertices, arestas)).toEqual([])
  })

  it('encontra o ciclo de três participantes', () => {
    // Grafo:  user1 → user2 → user3 → user1
    // Resultado à mão: 1 ciclo, com os 3 participantes.
    const vertices = ['user1', 'user2', 'user3']
    const arestas = [aresta('user1', 'user2'), aresta('user2', 'user3'), aresta('user3', 'user1')]

    const ciclos = detectarCiclos(vertices, arestas)

    expect(ciclos).toHaveLength(1)
    expect(conjunto(ciclos[0])).toEqual(['user1', 'user2', 'user3'])
  })

  it('ignora o empate técnico entre dois participantes (ciclo de tamanho 2)', () => {
    // Grafo: user1 ⇄ user2. Por que: ciclos de 2 não são interessantes (e o saldo
    // agregado nunca produz arestas nos dois sentidos); o código exige 3 ou mais.
    const arestas = [aresta('user1', 'user2'), aresta('user2', 'user1')]

    expect(detectarCiclos(['user1', 'user2'], arestas)).toEqual([])
  })

  it('encontra dois ciclos que não se tocam', () => {
    // Grafo: user1 → user2 → user3 → user1   e   user4 → user5 → user6 → user4.
    // Resultado à mão: 2 ciclos de tamanho 3.
    const vertices = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6']
    const arestas = [
      aresta('user1', 'user2'), aresta('user2', 'user3'), aresta('user3', 'user1'),
      aresta('user4', 'user5'), aresta('user5', 'user6'), aresta('user6', 'user4'),
    ]

    const ciclos = detectarCiclos(vertices, arestas)

    expect(ciclos).toHaveLength(2)
    expect(ciclos.map(conjunto)).toEqual([
      ['user1', 'user2', 'user3'],
      ['user4', 'user5', 'user6'],
    ])
  })

  it('reporta ciclos de tamanhos diferentes que compartilham participantes', () => {
    // Grafo: user1 → user2 → user3 → user1 (ciclo de 3) e user3 → user4 → user1.
    //   user1 → user2 → user3 ─┬─▶ user1
    //                          └─▶ user4 ──▶ user1
    // Resultado à mão: o ciclo {1,2,3} e o ciclo {1,2,3,4} (user1→2→3→4→1).
    const vertices = ['user1', 'user2', 'user3', 'user4']
    const arestas = [
      aresta('user1', 'user2'), aresta('user2', 'user3'),
      aresta('user3', 'user1'), aresta('user3', 'user4'), aresta('user4', 'user1'),
    ]

    const ciclos = detectarCiclos(vertices, arestas)

    expect(ciclos.map(conjunto)).toEqual([
      ['user1', 'user2', 'user3'],
      ['user1', 'user2', 'user3', 'user4'],
    ])
  })

  it('não repete o mesmo ciclo quando a aresta de volta aparece duas vezes', () => {
    // Por que: a deduplicação compara o conjunto de participantes (assinatura ordenada).
    // Aqui user3 → user1 está duplicada na lista, o que faz o DFS fechar o ciclo duas vezes.
    // Observação: no uso real, agregarSaldo gera uma aresta por par, então esta situação
    // só ocorre com entrada duplicada. Resultado à mão: 1 ciclo, não 2.
    const vertices = ['user1', 'user2', 'user3']
    const arestas = [
      aresta('user1', 'user2'), aresta('user2', 'user3'),
      aresta('user3', 'user1'), aresta('user3', 'user1'),
    ]

    expect(detectarCiclos(vertices, arestas)).toHaveLength(1)
  })
})
