import { describe, expect, it } from 'vitest'
import { calcularGrupos, ganhouPontoExtra } from '../../src/modules/palpites/palpites.regras.js'

// Regra da fase de grupos (palpites.regras.ts):
//   placar exato ................................... 10 pontos (total, sem somar bônus)
//   acertou só o resultado (vitória/empate) ........ 5 pontos
//     + 2 de bônus se acertou os gols de um dos times OU o saldo de gols
//   errou o resultado .............................. 0 pontos
//
// Convenção de leitura: placar(2, 1) = 2 gols da casa x 1 gol do visitante.
const placar = (golsCasa: number, golsVisitante: number) => ({ golsCasa, golsVisitante })

describe('Pontuação da fase de grupos: placar exato', () => {
  it('dá 10 pontos quando o placar é exato', () => {
    // Arrange
    const palpite = placar(2, 1)
    const resultado = placar(2, 1)

    // Act
    const pontuacao = calcularGrupos(palpite, resultado)

    // Assert
    expect(pontuacao).toEqual({ pontos: 10, status: 'ACERTO_PLACAR' })
  })

  it('dá 10 pontos ao acertar um 0 a 0', () => {
    // Por que: 0 a 0 é o caso em que "gols de um time" e "saldo" coincidem com tudo;
    // garante que o placar exato continua valendo 10 e não 5 + 2.
    expect(calcularGrupos(placar(0, 0), placar(0, 0))).toEqual({ pontos: 10, status: 'ACERTO_PLACAR' })
  })

  it('dá 10 pontos ao acertar uma goleada', () => {
    expect(calcularGrupos(placar(7, 0), placar(7, 0))).toEqual({ pontos: 10, status: 'ACERTO_PLACAR' })
  })
})

describe('Pontuação da fase de grupos: acerto só do resultado', () => {
  it('dá 5 pontos ao acertar o vencedor sem acertar gols nem saldo', () => {
    // Arrange: palpite 3 x 0 (saldo +3), resultado 2 x 1 (saldo +1); nenhum gol coincide.
    const palpite = placar(3, 0)
    const resultado = placar(2, 1)

    // Act
    const pontuacao = calcularGrupos(palpite, resultado)

    // Assert
    expect(pontuacao).toEqual({ pontos: 5, status: 'ACERTO_VENCEDOR' })
  })

  it('soma 2 pontos de bônus ao acertar o vencedor e os gols da casa', () => {
    // Palpite 2 x 0, resultado 2 x 1: vitória da casa nos dois; gols da casa iguais (2 = 2).
    expect(calcularGrupos(placar(2, 0), placar(2, 1))).toEqual({ pontos: 7, status: 'ACERTO_VENCEDOR' })
  })

  it('soma 2 pontos de bônus ao acertar o vencedor e os gols do visitante', () => {
    // Palpite 0 x 3, resultado 1 x 3: vitória do visitante nos dois; gols do visitante iguais (3 = 3).
    expect(calcularGrupos(placar(0, 3), placar(1, 3))).toEqual({ pontos: 7, status: 'ACERTO_VENCEDOR' })
  })

  it('soma 2 pontos de bônus ao acertar o vencedor e o saldo de gols', () => {
    // Palpite 3 x 1 (saldo +2), resultado 2 x 0 (saldo +2); nenhum gol coincide, só o saldo.
    expect(calcularGrupos(placar(3, 1), placar(2, 0))).toEqual({ pontos: 7, status: 'ACERTO_VENCEDOR' })
  })

  it('dá 7 pontos a um empate palpitado com placar errado', () => {
    // Por que: empate com placar diferente (1 x 1 contra 2 x 2) acerta o resultado
    // e também o saldo (0 = 0), então leva os 5 pontos + 2 de bônus.
    expect(calcularGrupos(placar(1, 1), placar(2, 2))).toEqual({ pontos: 7, status: 'ACERTO_VENCEDOR' })
  })
})

describe('Pontuação da fase de grupos: erro', () => {
  it('dá 0 pontos quando o resultado é errado', () => {
    // Palpite: casa vence. Resultado: visitante vence.
    expect(calcularGrupos(placar(2, 0), placar(0, 1))).toEqual({ pontos: 0, status: 'ERRO' })
  })

  it('dá 0 pontos ao palpitar vitória e o jogo terminar empatado', () => {
    expect(calcularGrupos(placar(1, 0), placar(1, 1))).toEqual({ pontos: 0, status: 'ERRO' })
  })

  it('não dá bônus de gols quando o resultado está errado', () => {
    // Por que: o bônus só existe junto com o acerto do resultado.
    // Aqui o gol do visitante coincide (1 = 1), mas o vencedor é outro.
    expect(calcularGrupos(placar(2, 1), placar(0, 1))).toEqual({ pontos: 0, status: 'ERRO' })
  })
})

describe('Bônus de gols ou saldo (ganhouPontoExtra)', () => {
  it('vale 2 quando os gols da casa coincidem', () => {
    expect(ganhouPontoExtra(placar(2, 0), placar(2, 3))).toBe(2)
  })

  it('vale 2 quando os gols do visitante coincidem', () => {
    expect(ganhouPontoExtra(placar(0, 1), placar(3, 1))).toBe(2)
  })

  it('vale 2 quando o saldo de gols coincide', () => {
    expect(ganhouPontoExtra(placar(3, 1), placar(2, 0))).toBe(2)
  })

  it('vale 0 quando nem gols nem saldo coincidem', () => {
    expect(ganhouPontoExtra(placar(3, 0), placar(2, 1))).toBe(0)
  })
})
