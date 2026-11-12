import { describe, expect, it } from 'vitest'
import { calcularPageRank } from '../../src/modules/grafo-confrontos/grafo-confrontos.algoritmos.js'
import type { ConfrontoAgregado } from '../../src/modules/grafo-confrontos/grafo-confrontos.algoritmos.js'

// Convenção de leitura dos grafos nestes testes:
//   uma aresta { vencedorId: 'A', perdedorId: 'B' } significa "user1 venceu user2" e
//   é desenhada A → B. No PageRank do projeto a pontuação flui do PERDEDOR para o
//   VENCEDOR (quem ganha de muita gente, e de gente forte, sobe no ranking).
//
// Fórmula (d = 0,85; N = nº de vértices):
//   PR(v) = (1 - d) / N + d * Σ PR(u) / L(u),  somando sobre os u que perderam para v,
//   onde L(u) é quantas derrotas u tem.
const aresta = (vencedorId: string, perdedorId: string): ConfrontoAgregado => ({ vencedorId, perdedorId, peso: 1 })
const soma = (pr: Map<string, number>) => [...pr.values()].reduce((total, valor) => total + valor, 0)

describe('PageRank', () => {
  it('devolve um mapa vazio para um grafo sem vértices', () => {
    expect(calcularPageRank([], []).size).toBe(0)
  })

  it('soma 1 quando todos os participantes têm pelo menos uma derrota', () => {
    // Arrange: ciclo de 3. user1 → user2 → user3 → user1 (cada um venceu um e perdeu um).
    //
    //   user1 ──▶ user2
    //     ▲          │
    //     └─ user3 ◀─┘
    //
    // Cálculo à mão: o grafo é simétrico, então o ponto fixo é PR = 1/3 para todos.
    // Conferência: (1 - 0,85)/3 + 0,85 * (1/3) / 1 = 0,05 + 0,28333 = 0,33333.
    // Como ninguém tem "saída zero" (todos perderam alguma vez), nenhuma massa se perde:
    // Σ PR = N * (1 - d)/N + d * Σ PR  =>  Σ PR = 1.
    const vertices = ['user1', 'user2', 'user3']
    const arestas = [aresta('user1', 'user2'), aresta('user2', 'user3'), aresta('user3', 'user1')]

    // Act
    const pr = calcularPageRank(vertices, arestas)

    // Assert
    expect(soma(pr)).toBeCloseTo(1, 5)
    for (const v of vertices) expect(pr.get(v)).toBeCloseTo(1 / 3, 5)
  })

  it('soma 1 num grafo assimétrico em que todos têm pelo menos uma derrota', () => {
    // Arrange: 4 participantes. Derrotas: user1 perdeu para user3 e user4; user2 perdeu
    // para user1; user3 perdeu para user2; user4 perdeu para user3.
    //
    // Arestas (vencedor → perdedor):
    //   user1 → user2,  user2 → user3,  user3 → user1,  user3 → user4,  user4 → user1
    //
    //   user1 ──▶ user2 ──▶ user3 ──▶ user4
    //     ▲          (user3 ──▶ user1)   │
    //     └──────────────────────────────┘   (user4 ──▶ user1)
    //
    // Cálculo à mão da soma: sem vértices de saída zero, a soma se conserva em cada
    // iteração (Σ novo = (1 - d) + d * Σ antigo), então o ponto fixo tem Σ PR = 1.
    const vertices = ['user1', 'user2', 'user3', 'user4']
    const arestas = [
      aresta('user1', 'user2'),
      aresta('user2', 'user3'),
      aresta('user3', 'user1'),
      aresta('user3', 'user4'),
      aresta('user4', 'user1'),
    ]

    // Act
    const pr = calcularPageRank(vertices, arestas)

    // Assert
    expect(soma(pr)).toBeCloseTo(1, 5)
  })

  it('ordena do mais forte ao mais fraco numa cadeia de vitórias', () => {
    // Arrange: user1 venceu user2 e user3; user2 venceu user3.
    //
    //   user1 ──▶ user2 ──▶ user3
    //     └─────────────────▲
    //
    // Cálculo à mão (N = 3, base = 0,15/3 = 0,05). Fluxo: perdedor → vencedor.
    //   user3 perdeu 2 vezes e ninguém perdeu para ele: PR(user3) = 0,05 (só a base).
    //   user2 recebe de user3 (que divide por 2 derrotas): 0,05 + 0,85 * 0,05/2 = 0,07125.
    //   user1 recebe de user2 (1 derrota) e de user3: 0,05 + 0,85 * (0,07125 + 0,05/2) = 0,1318125.
    // Ordem esperada: user1 > user2 > user3.
    const vertices = ['user1', 'user2', 'user3']
    const arestas = [aresta('user1', 'user2'), aresta('user1', 'user3'), aresta('user2', 'user3')]

    // Act
    const pr = calcularPageRank(vertices, arestas)
    const ordem = [...vertices].sort((a, b) => pr.get(b)! - pr.get(a)!)

    // Assert
    expect(ordem).toEqual(['user1', 'user2', 'user3'])
    expect(pr.get('user1')).toBeCloseTo(0.1318125, 4)
    expect(pr.get('user2')).toBeCloseTo(0.07125, 4)
    expect(pr.get('user3')).toBeCloseTo(0.05, 4)
  })

  it('DOCUMENTA O COMPORTAMENTO ATUAL (não o desejado): a soma fica abaixo de 1 quando há um invicto', () => {
    // Este teste NÃO diz que o comportamento está certo. Ele registra o que o código faz hoje.
    //
    // Hipótese (leitura do código): quem nunca perdeu (user1 na cadeia abaixo) não tem
    // derrotas, logo não distribui sua pontuação para ninguém e a massa "vaza" a cada
    // iteração. Num PageRank clássico, vértices sem saída redistribuem a massa por todos.
    //
    // Grafo: o mesmo da cadeia acima (user1 venceu todos; user1 é o invicto).
    // Valores calculados à mão acima: 0,1318125 + 0,07125 + 0,05 = 0,2530625.
    // Se um dia o PageRank for corrigido para redistribuir a massa, este teste deve
    // FALHAR e ser substituído por um que espere soma = 1.
    const vertices = ['user1', 'user2', 'user3']
    const arestas = [aresta('user1', 'user2'), aresta('user1', 'user3'), aresta('user2', 'user3')]

    // Act
    const pr = calcularPageRank(vertices, arestas)

    // Assert
    expect(soma(pr)).toBeCloseTo(0.2530625, 4)
    expect(soma(pr)).toBeLessThan(1)
  })
})
