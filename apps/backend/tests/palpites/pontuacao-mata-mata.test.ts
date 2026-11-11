import { describe, expect, it } from 'vitest'
import { calcularMataMata } from '../../src/modules/palpites/palpites.regras.js'

// Tabela do mata-mata (palpites.regras.ts), em ordem de avaliação:
//
//  | Situação                                                          | Pontos | Status          |
//  |-------------------------------------------------------------------|--------|-----------------|
//  | Placar exato e jogo decidido nos pênaltis com vencedor certo      |   20   | ACERTO_PLACAR   |
//  | Placar exato (sem pênaltis, ou pênalti com vencedor errado)       |   15   | ACERTO_PLACAR   |
//  | Jogo foi a pênaltis, palpitou vitória (não empate)                |    0   | ERRO            |
//  | Jogo foi a pênaltis, palpitou empate + vencedor do pênalti certo  |   15   | ACERTO_VENCEDOR |
//  | Jogo foi a pênaltis, palpitou empate + vencedor do pênalti errado|   10   | ACERTO_BONUS    |
//  | Sem pênaltis, vencedor certo + gols de um time ou saldo certo     |   10   | ACERTO_VENCEDOR |
//  | Sem pênaltis, vencedor certo, sem bônus                           |    7   | ACERTO_VENCEDOR |
//  | Sem pênaltis, vencedor errado (ou palpitou empate)                |    0   | ERRO            |
//
// Convenção: no resultado, `penalti: true` significa que o jogo terminou empatado
// no tempo normal/prorrogação e foi decidido nos pênaltis.
type Palpite = { golsCasa: number; golsVisitante: number; vencedorPenalti: 'CASA' | 'VISITANTE' | null }
type Resultado = Palpite & { penalti: boolean }

const palpite = (golsCasa: number, golsVisitante: number, vencedorPenalti: Palpite['vencedorPenalti'] = null): Palpite =>
  ({ golsCasa, golsVisitante, vencedorPenalti })

const jogoNormal = (golsCasa: number, golsVisitante: number): Resultado =>
  ({ golsCasa, golsVisitante, penalti: false, vencedorPenalti: null })

const jogoNosPenaltis = (golsCasa: number, golsVisitante: number, vencedorPenalti: 'CASA' | 'VISITANTE'): Resultado =>
  ({ golsCasa, golsVisitante, penalti: true, vencedorPenalti })

describe('Mata-mata: placar exato', () => {
  it('dá 20 pontos ao acertar o placar de um empate e o vencedor dos pênaltis', () => {
    // Arrange: palpitou 1 x 1 e CASA nos pênaltis; o jogo foi 1 x 1 e a casa ganhou nos pênaltis.
    const meuPalpite = palpite(1, 1, 'CASA')
    const resultado = jogoNosPenaltis(1, 1, 'CASA')

    // Act
    const pontuacao = calcularMataMata(meuPalpite, resultado)

    // Assert
    expect(pontuacao).toEqual({ pontos: 20, status: 'ACERTO_PLACAR' })
  })

  it('dá 15 pontos ao acertar o placar de um empate mas errar o vencedor dos pênaltis', () => {
    expect(calcularMataMata(palpite(1, 1, 'VISITANTE'), jogoNosPenaltis(1, 1, 'CASA')))
      .toEqual({ pontos: 15, status: 'ACERTO_PLACAR' })
  })

  it('dá 15 pontos ao acertar o placar de um jogo decidido sem pênaltis', () => {
    expect(calcularMataMata(palpite(2, 1), jogoNormal(2, 1)))
      .toEqual({ pontos: 15, status: 'ACERTO_PLACAR' })
  })

  it('dá 15 pontos ao acertar um 0 a 0 que foi decidido nos pênaltis com vencedor errado', () => {
    // Borda: 0 x 0 é placar exato, mas o palpite de pênalti estava errado.
    expect(calcularMataMata(palpite(0, 0, 'VISITANTE'), jogoNosPenaltis(0, 0, 'CASA')))
      .toEqual({ pontos: 15, status: 'ACERTO_PLACAR' })
  })
})

describe('Mata-mata: jogo decidido nos pênaltis', () => {
  it('dá 0 pontos a quem palpitou vitória num jogo que terminou empatado', () => {
    // Por que: o jogo foi empate (1 x 1); quem apostou em vitória errou o resultado.
    expect(calcularMataMata(palpite(2, 1), jogoNosPenaltis(1, 1, 'CASA')))
      .toEqual({ pontos: 0, status: 'ERRO' })
  })

  it('dá 15 pontos a quem palpitou empate de outro placar e acertou o vencedor dos pênaltis', () => {
    // Palpitou 0 x 0, saiu 1 x 1: errou o placar, acertou "empate" + quem ganhou nos pênaltis.
    expect(calcularMataMata(palpite(0, 0, 'CASA'), jogoNosPenaltis(1, 1, 'CASA')))
      .toEqual({ pontos: 15, status: 'ACERTO_VENCEDOR' })
  })

  it('dá 10 pontos a quem palpitou empate de outro placar e errou o vencedor dos pênaltis', () => {
    expect(calcularMataMata(palpite(0, 0, 'VISITANTE'), jogoNosPenaltis(1, 1, 'CASA')))
      .toEqual({ pontos: 10, status: 'ACERTO_BONUS' })
  })

  it('dá 10 pontos a quem palpitou empate e não indicou vencedor dos pênaltis', () => {
    // Borda: vencedorPenalti nulo nunca é igual ao vencedor real, então cai nos 10 pontos.
    expect(calcularMataMata(palpite(0, 0, null), jogoNosPenaltis(1, 1, 'CASA')))
      .toEqual({ pontos: 10, status: 'ACERTO_BONUS' })
  })
})

describe('Mata-mata: jogo decidido sem pênaltis', () => {
  it('dá 10 pontos ao acertar o vencedor e os gols de um dos times', () => {
    // Palpite 2 x 0, resultado 1 x 0: casa vence; gols do visitante coincidem (0 = 0).
    expect(calcularMataMata(palpite(2, 0), jogoNormal(1, 0)))
      .toEqual({ pontos: 10, status: 'ACERTO_VENCEDOR' })
  })

  it('dá 10 pontos ao acertar o vencedor e o saldo de gols', () => {
    // Palpite 3 x 1 (saldo +2), resultado 2 x 0 (saldo +2); nenhum gol coincide.
    expect(calcularMataMata(palpite(3, 1), jogoNormal(2, 0)))
      .toEqual({ pontos: 10, status: 'ACERTO_VENCEDOR' })
  })

  it('dá 7 pontos ao acertar só o vencedor', () => {
    // Palpite 3 x 0 (saldo +3), resultado 2 x 1 (saldo +1); nenhum gol coincide.
    expect(calcularMataMata(palpite(3, 0), jogoNormal(2, 1)))
      .toEqual({ pontos: 7, status: 'ACERTO_VENCEDOR' })
  })

  it('dá 10 pontos ao acertar uma vitória do visitante com gol de um time coincidente', () => {
    // Cobre o lado do visitante: palpite 0 x 2, resultado 0 x 1; gols da casa iguais (0 = 0).
    expect(calcularMataMata(palpite(0, 2), jogoNormal(0, 1)))
      .toEqual({ pontos: 10, status: 'ACERTO_VENCEDOR' })
  })

  it('dá 0 pontos ao apostar no time errado', () => {
    expect(calcularMataMata(palpite(0, 1), jogoNormal(1, 0))).toEqual({ pontos: 0, status: 'ERRO' })
  })

  it('dá 0 pontos a quem palpitou empate num jogo que teve vencedor sem pênaltis', () => {
    // Por que: o jogo acabou com vencedor no tempo jogado, então o empate palpitado está errado.
    expect(calcularMataMata(palpite(1, 1, 'CASA'), jogoNormal(2, 1))).toEqual({ pontos: 0, status: 'ERRO' })
  })
})
