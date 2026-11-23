import { describe, expect, it } from 'vitest'
import { arestasDeConfrontos } from '../../src/modules/grafo-confrontos/grafo-confrontos.algoritmos.js'

// O grafo de confrontos é construído a partir dos palpites dos jogos encerrados
// (não da tabela Confronto). Base pequena usada em todos os casos:
//
//   jogo1 (Matchday 1): user1 10 pts, user2 5 pts. user3 cadastrado antes, não palpitou.
//   jogo2 (Matchday 2): user2 10 pts, user3 0 pts. user1 cadastrado antes, não palpitou.
//
// Sem a regra:  jogo1 → 1>2;  jogo2 → 2>3.
// Com a regra:  jogo1 → 1>2, 1>3, 2>3;  jogo2 → 2>3, 2>1, 3>1.
const antes = new Date('2026-06-01T00:00:00.000Z')
const base = {
  jogos: [
    { id: 'jogo1', rodada: 'Matchday 1', dataHora: new Date('2026-06-11T15:00:00.000Z') },
    { id: 'jogo2', rodada: 'Matchday 2', dataHora: new Date('2026-06-15T15:00:00.000Z') },
  ],
  palpites: [
    { id: 'p1', usuarioId: 'user1', jogoId: 'jogo1', pontos: 10 },
    { id: 'p2', usuarioId: 'user2', jogoId: 'jogo1', pontos: 5 },
    { id: 'p3', usuarioId: 'user2', jogoId: 'jogo2', pontos: 10 },
    { id: 'p4', usuarioId: 'user3', jogoId: 'jogo2', pontos: 0 },
  ],
  usuarios: [
    { id: 'user1', criadoEm: antes },
    { id: 'user2', criadoEm: antes },
    { id: 'user3', criadoEm: antes },
  ],
}
const e = (vencedorId: string, perdedorId: string, peso: number) => ({ vencedorId, perdedorId, peso })

describe('Grafo de confrontos a partir dos palpites', () => {
  it('sem a regra, só compara quem palpitou no mesmo jogo', () => {
    // Resultado à mão: 1>2 (jogo1) e 2>3 (jogo2), cada uma com saldo 1.
    expect(arestasDeConfrontos(base, { considerarAusencia: false })).toEqual([
      e('user1', 'user2', 1), e('user2', 'user3', 1),
    ])
  })

  it('com a regra, soma as ausências antes de calcular o saldo', () => {
    // Pares: (1,2): 1>2 no jogo1, 2>1 no jogo2 → saldo 0, sem aresta.
    //        (1,3): 1>3 no jogo1, 3>1 no jogo2 → saldo 0, sem aresta.
    //        (2,3): 2>3 nos dois jogos       → user2 → user3, peso 2.
    expect(arestasDeConfrontos(base, { considerarAusencia: true })).toEqual([e('user2', 'user3', 2)])
  })

  it('filtra por rodada', () => {
    // Só Matchday 1, com a regra: 1>2, 1>3, 2>3.
    expect(arestasDeConfrontos(base, { rodadas: ['Matchday 1'], considerarAusencia: true })).toEqual([
      e('user1', 'user2', 1), e('user1', 'user3', 1), e('user2', 'user3', 1),
    ])
  })

  it('com recorte de participantes, ninguém de fora vence nem perde', () => {
    // Recorte {user1, user2}, com a regra. jogo1: 1>2. jogo2: user2 palpitou e user1
    // estava ausente → 2>1. user3 está fora do recorte. Saldo (1,2) = 0: sem arestas.
    const idsPermitidos = new Set(['user1', 'user2'])

    expect(arestasDeConfrontos(base, { idsPermitidos, considerarAusencia: true })).toEqual([])
    expect(arestasDeConfrontos(base, { idsPermitidos, considerarAusencia: false })).toEqual([e('user1', 'user2', 1)])
  })

  it('devolve as arestas sempre na mesma ordem, qualquer que seja a ordem de entrada', () => {
    // Por que: ciclos e caminho mais longo dependem da ordem de visita.
    const invertida = { ...base, palpites: [...base.palpites].reverse(), jogos: [...base.jogos].reverse() }

    expect(arestasDeConfrontos(invertida, { considerarAusencia: true, rodadas: ['Matchday 1'] }))
      .toEqual(arestasDeConfrontos(base, { considerarAusencia: true, rodadas: ['Matchday 1'] }))
  })

  it('base sem jogos não tem arestas', () => {
    expect(arestasDeConfrontos({ ...base, jogos: [] }, { considerarAusencia: true })).toEqual([])
  })
})
