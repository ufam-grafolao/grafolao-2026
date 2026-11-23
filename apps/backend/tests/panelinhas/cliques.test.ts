import { describe, expect, it } from 'vitest'
import { cliquesMaximais, ordemDegenerescencia, resumirPanelas } from '../../src/modules/panelinhas/panelinhas.algoritmos.js'

// Cliques maximais (Bron–Kerbosch com pivô e ordem de degenerescência).
// Uma clique é um grupo em que todos estão ligados a todos; é maximal se não dá para
// incluir mais ninguém. Arestas não têm sentido: { a: 'user1', b: 'user2' } = user1 — user2.
const aresta = (a: string, b: string) => ({ a, b })
const ordenar = (cliques: string[][]) => cliques.map(c => c.join(',')).sort()

describe('Cliques maximais', () => {
  it('grafo vazio não tem cliques', () => {
    expect(cliquesMaximais([], []).cliques).toEqual([])
  })

  it('vértices sem arestas são cliques de tamanho 1', () => {
    expect(ordenar(cliquesMaximais(['user1', 'user2'], []).cliques)).toEqual(['user1', 'user2'])
  })

  it('um triângulo é uma única clique de 3', () => {
    const r = cliquesMaximais(['user1', 'user2', 'user3'], [
      aresta('user1', 'user2'), aresta('user2', 'user3'), aresta('user1', 'user3'),
    ])

    expect(r.cliques).toEqual([['user1', 'user2', 'user3']])
    expect(r.completou).toBe(true)
  })

  it('encontra as cliques de dois triângulos que dividem uma aresta', () => {
    //   user1 ── user2
    //     │  ╲    │  ╲
    //     │    ╲  │    user4        arestas: 1-2, 1-3, 2-3, 2-4, 3-4
    //   user3 ────┘──╱              (1 e 4 não se ligam)
    // Resultado à mão: {1,2,3} e {2,3,4}.
    const r = cliquesMaximais(['user1', 'user2', 'user3', 'user4'], [
      aresta('user1', 'user2'), aresta('user1', 'user3'), aresta('user2', 'user3'),
      aresta('user2', 'user4'), aresta('user3', 'user4'),
    ])

    expect(ordenar(r.cliques)).toEqual(['user1,user2,user3', 'user2,user3,user4'])
  })

  it('K4 mais uma aresta pendurada', () => {
    // K4 = {1,2,3,4} todos ligados; user5 ligado só a user4.
    // Resultado à mão: {1,2,3,4} (tamanho 4) e {4,5} (tamanho 2).
    const k4 = [['user1', 'user2'], ['user1', 'user3'], ['user1', 'user4'], ['user2', 'user3'], ['user2', 'user4'], ['user3', 'user4']]
    const r = cliquesMaximais(['user1', 'user2', 'user3', 'user4', 'user5'], [
      ...k4.map(([a, b]) => aresta(a, b)), aresta('user4', 'user5'),
    ])

    expect(r.cliques).toEqual([['user1', 'user2', 'user3', 'user4'], ['user4', 'user5']])
  })

  it('o ciclo de 4 (quadrado) só tem cliques de 2', () => {
    // 1-2-3-4-1, sem diagonais. Resultado à mão: as 4 arestas, nenhum triângulo.
    const r = cliquesMaximais(['user1', 'user2', 'user3', 'user4'], [
      aresta('user1', 'user2'), aresta('user2', 'user3'), aresta('user3', 'user4'), aresta('user4', 'user1'),
    ])

    expect(ordenar(r.cliques)).toEqual(['user1,user2', 'user1,user4', 'user2,user3', 'user3,user4'])
  })

  it('devolve completou = false quando o orçamento acaba', () => {
    // Por que: com orçamento negativo a primeira checagem já estoura; a resposta tem
    // de dizer que o resultado é parcial, como no caminho mais longo.
    const r = cliquesMaximais(['user1', 'user2', 'user3'], [aresta('user1', 'user2')], -1)

    expect(r.completou).toBe(false)
  })
})

describe('Ordem de degenerescência', () => {
  it('remove sempre o vértice de menor grau restante, desempatando pela ordem de entrada', () => {
    // Triângulo 1-2-3 com user4 pendurado em user3. Graus: 1=2, 2=2, 3=3, 4=1.
    // Resultado à mão:
    //   sai user4 (grau 1)            → graus 1=2, 2=2, 3=2
    //   empate: sai user1 (vem antes) → graus 2=1, 3=1
    //   empate: sai user2, depois user3
    const ordem = ordemDegenerescencia(['user1', 'user2', 'user3', 'user4'], [
      aresta('user1', 'user2'), aresta('user2', 'user3'), aresta('user1', 'user3'), aresta('user3', 'user4'),
    ])

    expect(ordem).toEqual(['user4', 'user1', 'user2', 'user3'])
  })
})

describe('Resumo das panelas', () => {
  it('conta só panelas de 3 ou mais e calcula o tamanho médio das top-k', () => {
    // Cliques: tamanhos 4, 3, 3 e 2. Panelas (≥3): 3. Top-2: 4 e 3 → média 3,5.
    const cliques = [['user1', 'user2', 'user3', 'user4'], ['user4', 'user5', 'user6'], ['user1', 'user5', 'user7'], ['user8', 'user9']]

    const resumo = resumirPanelas(cliques, 2)

    expect(resumo.tamanhoMaximo).toBe(4)
    expect(resumo.totalPanelas).toBe(3)
    expect(resumo.tamanhoMedioTopK).toBe(3.5)
    expect(resumo.panelasPorParticipante.get('user1')).toBe(2)
    expect(resumo.panelasPorParticipante.has('user8')).toBe(false)
  })

  it('sem panelas a média das top-k é 0', () => {
    expect(resumirPanelas([['user1', 'user2']], 5)).toMatchObject({ totalPanelas: 0, tamanhoMedioTopK: 0, tamanhoMaximo: 2 })
  })
})

describe('Conferência contra força bruta', () => {
  it('acha as mesmas cliques maximais que testar todos os subconjuntos', () => {
    // Por que: grafos à mão cobrem casos conhecidos; aqui um grafo de 10 vértices com
    // arestas sorteadas (semente fixa) é comparado com a enumeração de todos os 2^10
    // subconjuntos, que é lenta mas obviamente correta.
    let semente = 7
    const sortear = () => (semente = (semente * 1103515245 + 12345) % 2 ** 31) / 2 ** 31
    const vertices = Array.from({ length: 10 }, (_, i) => `user${i + 1}`)
    const arestas: { a: string; b: string }[] = []
    for (let i = 0; i < vertices.length; i++)
      for (let j = i + 1; j < vertices.length; j++)
        if (sortear() < 0.5) arestas.push(aresta(vertices[i], vertices[j]))

    const ligados = new Set(arestas.flatMap(({ a, b }) => [`${a}|${b}`, `${b}|${a}`]))
    const ehClique = (s: string[]) => s.every((u, i) => s.slice(i + 1).every(w => ligados.has(`${u}|${w}`)))
    const subconjuntos = Array.from({ length: 2 ** vertices.length }, (_, m) => vertices.filter((_, i) => m & (1 << i)))
    const cliques = subconjuntos.filter(s => s.length > 0 && ehClique(s))
    const maximais = cliques.filter(c => !vertices.some(v => !c.includes(v) && ehClique([...c, v])))

    expect(ordenar(cliquesMaximais(vertices, arestas).cliques)).toEqual(ordenar(maximais.map(c => [...c].sort())))
  })
})
