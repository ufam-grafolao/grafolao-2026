import { describe, expect, it } from 'vitest'
import {
  distanciaMediaAgregada,
  distanciaPalpites,
  grafoCompletoDoJogo,
  resultadoDoPlacar,
} from '../../src/shared/similaridade/similaridade-palpites.js'

// Distância entre dois palpites do mesmo jogo:
//   0 = placar idêntico; 0,5 = mesmo resultado, placar diferente; 1 = resultado diferente.
const placar = (golsCasa: number, golsVisitante: number) => ({ golsCasa, golsVisitante })
const palpite = (usuarioId: string, golsCasa: number, golsVisitante: number) => ({ usuarioId, golsCasa, golsVisitante })

describe('Resultado de um placar', () => {
  it('identifica vitória da casa, empate e vitória do visitante', () => {
    expect(resultadoDoPlacar(placar(2, 1))).toBe('CASA')
    expect(resultadoDoPlacar(placar(1, 1))).toBe('EMPATE')
    expect(resultadoDoPlacar(placar(0, 3))).toBe('VISITANTE')
  })
})

describe('Distância entre dois palpites', () => {
  it('é 0 quando o placar é idêntico', () => {
    expect(distanciaPalpites(placar(2, 1), placar(2, 1))).toBe(0)
  })

  it('é 0,5 quando o vencedor é o mesmo e o placar é diferente', () => {
    expect(distanciaPalpites(placar(2, 1), placar(3, 0))).toBe(0.5)
  })

  it('é 0,5 entre dois empates com placares diferentes', () => {
    // Por que: empate também é um resultado; 0×0 e 1×1 concordam no resultado.
    expect(distanciaPalpites(placar(0, 0), placar(1, 1))).toBe(0.5)
  })

  it('é 1 quando o resultado é diferente', () => {
    expect(distanciaPalpites(placar(2, 1), placar(1, 1))).toBe(1)
    expect(distanciaPalpites(placar(2, 1), placar(1, 2))).toBe(1)
  })

  it('é simétrica', () => {
    expect(distanciaPalpites(placar(3, 0), placar(0, 0))).toBe(distanciaPalpites(placar(0, 0), placar(3, 0)))
  })
})

describe('Grafo completo de um jogo', () => {
  it('tem uma aresta por par de palpiteiros', () => {
    // 3 palpiteiros → 3 pares. user1 2×1, user2 2×1, user3 0×0.
    // Resultado à mão: (1,2)=0, (1,3)=1, (2,3)=1.
    const arestas = grafoCompletoDoJogo([palpite('user1', 2, 1), palpite('user2', 2, 1), palpite('user3', 0, 0)])

    expect(arestas).toEqual([
      { a: 'user1', b: 'user2', peso: 0 },
      { a: 'user1', b: 'user3', peso: 1 },
      { a: 'user2', b: 'user3', peso: 1 },
    ])
  })

  it('jogo com um palpiteiro não tem arestas', () => {
    expect(grafoCompletoDoJogo([palpite('user1', 1, 0)])).toEqual([])
  })
})

describe('Distância média agregada', () => {
  it('faz a média só nos jogos que o par palpitou junto', () => {
    // Jogo A: user1 2×1, user2 2×1 (d=0). Jogo B: user1 1×0, user2 0×1 (d=1).
    // Jogo C: só user1 palpitou (não conta para o par).
    // Resultado à mão: média (0 + 1) / 2 = 0,5 em 2 jogos em comum.
    const agregado = distanciaMediaAgregada([
      [palpite('user1', 2, 1), palpite('user2', 2, 1)],
      [palpite('user1', 1, 0), palpite('user2', 0, 1)],
      [palpite('user1', 3, 3)],
    ])

    expect(agregado).toEqual([{ a: 'user1', b: 'user2', peso: 0.5, jogosEmComum: 2 }])
  })
})
