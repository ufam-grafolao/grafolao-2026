import { describe, expect, it } from 'vitest'
import { agregarSaldo, gerarConfrontosDoJogo } from '../../src/modules/grafo-confrontos/grafo-confrontos.algoritmos.js'

// Construção das arestas do grafo de confrontos, em duas etapas:
//   1. Por jogo: cada par de palpites é comparado pelos pontos. Mais pontos vence;
//      pontos iguais não geram aresta.
//   2. Agregada: somando os jogos, o peso é o saldo w(A,B) = vitórias de A sobre B −
//      vitórias de B sobre A. Só há aresta se o saldo for diferente de zero.
// Aresta "A → B" significa "user A venceu user B".
const palpite = (usuarioId: string, pontos: number) => ({ id: `palpite-${usuarioId}`, usuarioId, pontos })

describe('Confrontos de um jogo', () => {
  it('cria aresta do participante com mais pontos para o com menos', () => {
    // Grafo: user1 (10 pts) ──▶ user2 (5 pts). Resultado à mão: 1 confronto.
    const confrontos = gerarConfrontosDoJogo([palpite('user1', 10), palpite('user2', 5)])

    expect(confrontos).toEqual([{ vencedorId: 'user1', perdedorId: 'user2', palpiteId: 'palpite-user1' }])
  })

  it('cria a aresta no sentido certo independentemente da ordem dos palpites', () => {
    const confrontos = gerarConfrontosDoJogo([palpite('user2', 5), palpite('user1', 10)])

    expect(confrontos).toEqual([{ vencedorId: 'user1', perdedorId: 'user2', palpiteId: 'palpite-user1' }])
  })

  it('não cria aresta quando há empate de pontos', () => {
    expect(gerarConfrontosDoJogo([palpite('user1', 5), palpite('user2', 5)])).toEqual([])
  })

  it('compara todos os pares e ignora só os empatados', () => {
    // Pontos: user1=10, user2=5, user3=5, user4=0.
    // Pares (6): 1>2, 1>3, 1>4, 2=3 (empate, sem aresta), 2>4, 3>4.
    // Resultado à mão: 5 arestas.
    const confrontos = gerarConfrontosDoJogo([
      palpite('user1', 10), palpite('user2', 5), palpite('user3', 5), palpite('user4', 0),
    ])

    expect(confrontos).toHaveLength(5)
    expect(confrontos.map(c => `${c.vencedorId}>${c.perdedorId}`).sort()).toEqual([
      'user1>user2', 'user1>user3', 'user1>user4', 'user2>user4', 'user3>user4',
    ])
  })

  it('não cria arestas com um único palpite ou nenhum', () => {
    expect(gerarConfrontosDoJogo([])).toEqual([])
    expect(gerarConfrontosDoJogo([palpite('user1', 10)])).toEqual([])
  })
})

describe('Saldo agregado entre dois participantes', () => {
  it('não gera arestas sem confrontos', () => {
    expect(agregarSaldo([])).toEqual([])
  })

  it('aponta para o vencedor líquido com peso igual ao saldo', () => {
    // user1 venceu user2 em 3 jogos; user2 venceu user1 em 1 jogo. Saldo = 3 − 1 = 2.
    // Resultado à mão: uma aresta user1 → user2 com peso 2.
    const confrontos = [
      { vencedorId: 'user1', perdedorId: 'user2' },
      { vencedorId: 'user1', perdedorId: 'user2' },
      { vencedorId: 'user2', perdedorId: 'user1' },
      { vencedorId: 'user1', perdedorId: 'user2' },
    ]

    expect(agregarSaldo(confrontos)).toEqual([{ vencedorId: 'user1', perdedorId: 'user2', peso: 2 }])
  })

  it('inverte o sentido quando o outro participante tem saldo positivo', () => {
    // user1 venceu 1 vez, user2 venceu 2 vezes. Saldo de user2 = 1.
    const confrontos = [
      { vencedorId: 'user1', perdedorId: 'user2' },
      { vencedorId: 'user2', perdedorId: 'user1' },
      { vencedorId: 'user2', perdedorId: 'user1' },
    ]

    expect(agregarSaldo(confrontos)).toEqual([{ vencedorId: 'user2', perdedorId: 'user1', peso: 1 }])
  })

  it('não cria aresta quando as vitórias se equilibram (saldo zero)', () => {
    // 1 vitória para cada lado: saldo 0, nenhuma aresta.
    const confrontos = [
      { vencedorId: 'user1', perdedorId: 'user2' },
      { vencedorId: 'user2', perdedorId: 'user1' },
    ]

    expect(agregarSaldo(confrontos)).toEqual([])
  })

  it('agrega cada par separadamente', () => {
    // user1 > user2 (1 vez), user2 > user3 (1 vez), user3 > user1 (1 vez): ciclo de 3 pares,
    // cada par com saldo 1. Resultado à mão: 3 arestas de peso 1.
    const confrontos = [
      { vencedorId: 'user1', perdedorId: 'user2' },
      { vencedorId: 'user2', perdedorId: 'user3' },
      { vencedorId: 'user3', perdedorId: 'user1' },
    ]

    const arestas = agregarSaldo(confrontos)

    expect(arestas).toHaveLength(3)
    expect(arestas.every(a => a.peso === 1)).toBe(true)
  })
})
