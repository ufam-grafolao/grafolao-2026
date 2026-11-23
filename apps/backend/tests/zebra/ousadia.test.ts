import { describe, expect, it } from 'vitest'
import {
  indiceDeZebra,
  ousadiaNoJogo,
  ousadosQueAcertaram,
  postosMedios,
  spearman,
} from '../../src/modules/zebra/zebra.algoritmos.js'

// Jogo de referência (resultado real 2×1):
//   user1 2×1 (10 pts), user2 2×1 (10 pts), user3 1×0 (7 pts: vencedor + saldo), user4 0×0 (0 pts)
// Distâncias: 1-2=0, 1-3=0,5, 1-4=1, 2-3=0,5, 2-4=1, 3-4=1.
const p = (usuarioId: string, golsCasa: number, golsVisitante: number, pontos = 0, jogoId = 'jogo1') =>
  ({ usuarioId, golsCasa, golsVisitante, pontos, jogoId })
const jogo = [p('user1', 2, 1, 10), p('user2', 2, 1, 10), p('user3', 1, 0, 7), p('user4', 0, 0, 0)]

describe('Ousadia num jogo', () => {
  it('média: média das distâncias aos demais', () => {
    // user1: (0 + 0,5 + 1)/3 = 0,5   user3: (0,5 + 0,5 + 1)/3 = 2/3   user4: (1+1+1)/3 = 1
    const o = ousadiaNoJogo(jogo, 'media')

    expect(o.get('user1')).toBeCloseTo(0.5)
    expect(o.get('user2')).toBeCloseTo(0.5)
    expect(o.get('user3')).toBeCloseTo(2 / 3)
    expect(o.get('user4')).toBe(1)
  })

  it('mediana: mediana das distâncias aos demais', () => {
    // user3: [0,5; 0,5; 1] → 0,5 (a média daria 2/3: a mediana ignora o único discordante)
    const o = ousadiaNoJogo(jogo, 'mediana')

    expect(o.get('user1')).toBe(0.5)
    expect(o.get('user3')).toBe(0.5)
    expect(o.get('user4')).toBe(1)
  })

  it('raridade: −ln da fração que deu o mesmo resultado', () => {
    // CASA: 3 de 4 → −ln(3/4) ≈ 0,288.   EMPATE: 1 de 4 → −ln(1/4) ≈ 1,386.
    const o = ousadiaNoJogo(jogo, 'raridade')

    expect(o.get('user1')).toBeCloseTo(-Math.log(3 / 4))
    expect(o.get('user3')).toBeCloseTo(-Math.log(3 / 4))
    expect(o.get('user4')).toBeCloseTo(Math.log(4))
  })

  it('é zero quando todos deram o mesmo placar', () => {
    const o = ousadiaNoJogo([p('user1', 1, 0), p('user2', 1, 0)], 'raridade')

    expect([...o.values()]).toEqual([0, 0])
  })

  it('é zero com um único palpiteiro (não há com quem comparar)', () => {
    expect(ousadiaNoJogo([p('user1', 5, 5)], 'media').get('user1')).toBe(0)
  })
})

describe('Índice de Zebra', () => {
  it('soma ousadia × pontos e ordena do maior para o menor', () => {
    // Com a média: user1 = 0,5 × 10 = 5; user2 = 5; user3 = 2/3 × 7 ≈ 4,67; user4 = 1 × 0 = 0.
    // Empate user1/user2 desempata pelo id.
    const ranking = indiceDeZebra(jogo, 'media')

    expect(ranking.map(l => l.usuarioId)).toEqual(['user1', 'user2', 'user3', 'user4'])
    expect(ranking[0].indice).toBeCloseTo(5)
    expect(ranking[2].indice).toBeCloseTo(14 / 3)
    expect(ranking[3].indice).toBe(0)
  })

  it('quem foi ousado e errou não ganha nada', () => {
    // user4 foi o mais ousado (1,0) mas fez 0 pontos: índice 0.
    expect(indiceDeZebra(jogo, 'media').find(l => l.usuarioId === 'user4')!.indice).toBe(0)
  })

  it('o índice médio divide pela quantidade de jogos palpitados', () => {
    // user1 palpita 2 jogos: o de referência (5) e um jogo2 sozinho (ousadia 0 → 0).
    // Resultado à mão: soma 5, média 5 / 2 = 2,5.
    const ranking = indiceDeZebra([...jogo, p('user1', 1, 1, 10, 'jogo2')], 'media')
    const user1 = ranking.find(l => l.usuarioId === 'user1')!

    expect(user1.indice).toBeCloseTo(5)
    expect(user1.jogosPalpitados).toBe(2)
    expect(user1.indiceMedio).toBeCloseTo(2.5)
  })

  it('ordenar pela média muda a ordem quando o volume de jogos é diferente', () => {
    // Médias: user2 = 5/1 = 5; user3 = 4,67/1; user1 = 5/2 = 2,5; user4 = 0.
    // Pela soma user1 empatava em 1º; pela média cai para 3º.
    const ranking = indiceDeZebra([...jogo, p('user1', 1, 1, 10, 'jogo2')], 'media', 'media')

    expect(ranking.map(l => l.usuarioId)).toEqual(['user2', 'user3', 'user1', 'user4'])
  })
})

describe('Ousados que acertaram', () => {
  it('lista só quem pontuou, do mais ousado para o menos', () => {
    // user4 (mais ousado) fez 0 e sai. user3 (2/3) vem antes de user1 e user2 (0,5).
    const lista = ousadosQueAcertaram(jogo, 'media')

    expect(lista.map(l => l.usuarioId)).toEqual(['user3', 'user1', 'user2'])
  })
})

describe('Spearman', () => {
  it('é 1 para rankings idênticos e −1 para rankings invertidos', () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1)
    expect(spearman([1, 2, 3, 4], [40, 30, 20, 10])).toBeCloseTo(-1)
  })

  it('usa postos médios nos empates', () => {
    // Valores 5, 5, 1: os dois 5 dividem os postos 1 e 2 → 1,5 cada; o 1 fica com o posto 3.
    expect(postosMedios([5, 5, 1])).toEqual([1.5, 1.5, 3])
  })
})
