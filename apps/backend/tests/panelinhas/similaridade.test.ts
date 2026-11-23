import { describe, expect, it } from 'vitest'
import {
  acertadoresPorJogo,
  construirGrafoSimilaridade,
  ehAcerto,
  limiarPercentil,
  pesosAcertosEmComum,
} from '../../src/modules/panelinhas/panelinhas.algoritmos.js'

// Grafo de similaridade das panelinhas: peso entre dois participantes = número de
// jogos que os dois acertaram. Aresta se o peso ≥ percentil p dos pesos positivos.
const acerto = (usuarioId: string, jogoId: string) => ({ usuarioId, jogoId, status: 'ACERTO_VENCEDOR' })
const erro = (usuarioId: string, jogoId: string) => ({ usuarioId, jogoId, status: 'ERRO' })

describe('O que conta como acerto', () => {
  it('conta placar exato e resultado certo', () => {
    expect(ehAcerto('ACERTO_PLACAR')).toBe(true)
    expect(ehAcerto('ACERTO_VENCEDOR')).toBe(true)
  })

  it('não conta erro nem palpite ainda pendente', () => {
    expect(ehAcerto('ERRO')).toBe(false)
    expect(ehAcerto('PENDENTE')).toBe(false)
  })

  it('conta ACERTO_BONUS por padrão e permite desligar', () => {
    // Por que: ACERTO_BONUS = palpitou empate, o jogo foi aos pênaltis e errou o vencedor
    // dos pênaltis. O resultado do tempo normal estava certo.
    expect(ehAcerto('ACERTO_BONUS')).toBe(true)
    expect(ehAcerto('ACERTO_BONUS', false)).toBe(false)
  })
})

describe('Pesos de acertos em comum', () => {
  it('soma 1 por jogo que o par acertou junto', () => {
    // jogo1: user1, user2, user3 acertaram. jogo2: user1, user2 acertaram; user3 errou.
    // Resultado à mão: (1,2)=2, (1,3)=1, (2,3)=1.
    const palpites = [
      acerto('user1', 'jogo1'), acerto('user2', 'jogo1'), acerto('user3', 'jogo1'),
      acerto('user1', 'jogo2'), acerto('user2', 'jogo2'), erro('user3', 'jogo2'),
    ]

    const pesos = pesosAcertosEmComum(acertadoresPorJogo(palpites))

    expect(Object.fromEntries(pesos)).toEqual({ 'user1|user2': 2, 'user1|user3': 1, 'user2|user3': 1 })
  })

  it('sem acertos não há pesos', () => {
    expect(pesosAcertosEmComum(acertadoresPorJogo([erro('user1', 'jogo1'), erro('user2', 'jogo1')])).size).toBe(0)
  })

  it('exclui jogos acertados por mais da fração pedida de quem palpitou', () => {
    // jogo1: 3 de 3 acertaram (100%). jogo2: 2 de 3 acertaram (67%).
    // Com excluirAcimaDe = 0,8: jogo1 sai (100% > 80%), jogo2 fica (67% ≤ 80%).
    const palpites = [
      acerto('user1', 'jogo1'), acerto('user2', 'jogo1'), acerto('user3', 'jogo1'),
      acerto('user1', 'jogo2'), acerto('user2', 'jogo2'), erro('user3', 'jogo2'),
    ]

    const jogos = acertadoresPorJogo(palpites, { excluirAcimaDe: 0.8 })

    expect([...jogos.keys()]).toEqual(['jogo2'])
  })
})

describe('Limiar por percentil (posto mais próximo)', () => {
  it('pega o valor na posição ceil(p·n)', () => {
    // Pesos ordenados: 1 1 2 3 5 (n = 5).
    //   p = 50 → posto ceil(2,5) = 3 → 2
    //   p = 80 → posto 4 → 3
    //   p = 100 → posto 5 → 5
    const pesos = [3, 1, 5, 1, 2]

    expect(limiarPercentil(pesos, 50)).toBe(2)
    expect(limiarPercentil(pesos, 80)).toBe(3)
    expect(limiarPercentil(pesos, 100)).toBe(5)
  })

  it('p = 0 usa o menor peso (todo par com acerto em comum vira aresta)', () => {
    expect(limiarPercentil([4, 2, 7], 0)).toBe(2)
  })

  it('sem pesos o limiar é infinito (nenhuma aresta)', () => {
    expect(limiarPercentil([], 90)).toBe(Infinity)
  })
})

describe('Grafo de similaridade', () => {
  it('mantém só os pares com peso no percentil pedido ou acima', () => {
    // Pesos (mesmo exemplo de cima): (1,2)=2, (1,3)=1, (2,3)=1. Ordenados: 1 1 2.
    // p = 90 → posto ceil(2,7) = 3 → limiar 2. Resultado à mão: só a aresta user1—user2.
    const palpites = [
      acerto('user1', 'jogo1'), acerto('user2', 'jogo1'), acerto('user3', 'jogo1'),
      acerto('user1', 'jogo2'), acerto('user2', 'jogo2'), erro('user3', 'jogo2'),
    ]

    const grafo = construirGrafoSimilaridade(['user1', 'user2', 'user3'], palpites, 90)

    expect(grafo.limiar).toBe(2)
    expect(grafo.arestas).toEqual([{ a: 'user1', b: 'user2', peso: 2 }])
  })

  it('ignora palpites de quem está fora do recorte', () => {
    // user9 acertou junto com todos, mas não está entre os vértices.
    const palpites = [acerto('user1', 'jogo1'), acerto('user2', 'jogo1'), acerto('user9', 'jogo1')]

    const grafo = construirGrafoSimilaridade(['user1', 'user2'], palpites, 0)

    expect(grafo.arestas).toEqual([{ a: 'user1', b: 'user2', peso: 1 }])
  })
})
