import { describe, expect, it } from 'vitest'
import { ordenarRodadasPorData } from '../../src/shared/utils/ordenar-rodadas.js'

// A ordem das rodadas vem da data do primeiro jogo de cada uma, não do nome.
// Dados sintéticos: só importam o nome da rodada e a data.
const jogo = (rodada: string, dataIso: string) => ({ rodada, dataHora: new Date(dataIso) })

describe('Ordem cronológica das rodadas', () => {
  it('devolve lista vazia quando não há jogos', () => {
    expect(ordenarRodadasPorData([])).toEqual([])
  })

  it('coloca "Matchday 2" antes de "Matchday 10"', () => {
    // Por que: em ordem de texto, "Matchday 10" vem antes de "Matchday 2" (o "1" é menor que o "2").
    // Aqui a rodada 2 acontece em 12/06 e a rodada 10 em 20/06, então a ordem correta é 2, 10.
    const jogos = [
      jogo('Matchday 10', '2026-06-20T15:00:00Z'),
      jogo('Matchday 2', '2026-06-12T15:00:00Z'),
    ]

    expect(ordenarRodadasPorData(jogos)).toEqual(['Matchday 2', 'Matchday 10'])
  })

  it('ordena uma sequência completa de rodadas pela data', () => {
    // Datas crescentes com o número da rodada: 1 (11/06), 2 (12/06), 9 (19/06), 10 (20/06), 11 (21/06).
    const jogos = [
      jogo('Matchday 11', '2026-06-21T15:00:00Z'),
      jogo('Matchday 1', '2026-06-11T15:00:00Z'),
      jogo('Matchday 10', '2026-06-20T15:00:00Z'),
      jogo('Matchday 2', '2026-06-12T15:00:00Z'),
      jogo('Matchday 9', '2026-06-19T15:00:00Z'),
    ]

    expect(ordenarRodadasPorData(jogos)).toEqual([
      'Matchday 1', 'Matchday 2', 'Matchday 9', 'Matchday 10', 'Matchday 11',
    ])
  })

  it('coloca as fases de mata-mata depois da fase de grupos', () => {
    // Por que: "Round of 32" e "Final" começam com letras que, em ordem de texto,
    // viriam antes de "Matchday". Pela data, o mata-mata vem depois dos grupos.
    const jogos = [
      jogo('Final', '2026-07-19T19:00:00Z'),
      jogo('Round of 32', '2026-06-28T15:00:00Z'),
      jogo('Matchday 17', '2026-06-27T15:00:00Z'),
      jogo('Quarter-final', '2026-07-09T19:00:00Z'),
      jogo('Matchday 1', '2026-06-11T15:00:00Z'),
    ]

    expect(ordenarRodadasPorData(jogos)).toEqual([
      'Matchday 1', 'Matchday 17', 'Round of 32', 'Quarter-final', 'Final',
    ])
  })

  it('usa a data do jogo mais cedo da rodada', () => {
    // A rodada A tem jogos em 15/06 e 25/06; a rodada B tem um jogo em 20/06.
    // O primeiro jogo de A (15/06) vem antes do de B (20/06), então a ordem é A, B.
    const jogos = [
      jogo('Matchday 5', '2026-06-25T15:00:00Z'),
      jogo('Matchday 6', '2026-06-20T15:00:00Z'),
      jogo('Matchday 5', '2026-06-15T15:00:00Z'),
    ]

    expect(ordenarRodadasPorData(jogos)).toEqual(['Matchday 5', 'Matchday 6'])
  })

  it('lista cada rodada uma única vez', () => {
    const jogos = [
      jogo('Matchday 1', '2026-06-11T15:00:00Z'),
      jogo('Matchday 1', '2026-06-11T18:00:00Z'),
      jogo('Matchday 1', '2026-06-12T15:00:00Z'),
    ]

    expect(ordenarRodadasPorData(jogos)).toEqual(['Matchday 1'])
  })

  it('desempata pelo número da rodada quando a data do primeiro jogo é igual', () => {
    // Por que: sem desempate o resultado dependeria da ordem de entrada.
    // Mesmo instante para as duas; o desempate numérico põe a 2 antes da 10.
    const jogos = [
      jogo('Matchday 10', '2026-06-20T15:00:00Z'),
      jogo('Matchday 2', '2026-06-20T15:00:00Z'),
    ]

    expect(ordenarRodadasPorData(jogos)).toEqual(['Matchday 2', 'Matchday 10'])
  })
})
