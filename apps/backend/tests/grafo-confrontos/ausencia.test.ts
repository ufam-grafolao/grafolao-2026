import { describe, expect, it } from 'vitest'
import {
  agregarSaldo,
  gerarConfrontosDeAusencia,
  gerarConfrontosDeAusenciaDosJogos,
  gerarConfrontosDoJogo,
  identificarAusentes,
} from '../../src/modules/grafo-confrontos/grafo-confrontos.algoritmos.js'

// Regra da ausência (decisão da orientadora), num jogo ENCERRADO:
//   - AUSENTE = não palpitou no jogo E já estava cadastrado antes do início.
//   - O ausente perde para todos que palpitaram, inclusive quem fez 0 pontos.
//   - Ausentes não se confrontam entre si.
//   - Quem se cadastrou no início do jogo ou depois não entra no confronto.
//
// Horário: o banco grava o horário de Manaus como se fosse UTC; o início real é +4h
// (mesma conversão do bloqueio de palpites). Aqui:
//   gravado = 2026-06-11T15:00Z  →  início real = 2026-06-11T19:00Z
const jogo = { id: 'jogo1', dataHora: new Date('2026-06-11T15:00:00.000Z') }
const inicioReal = new Date('2026-06-11T19:00:00.000Z')
const antes = new Date('2026-06-01T00:00:00.000Z')
const depois = new Date('2026-06-12T00:00:00.000Z')

const usuario = (id: string, criadoEm: Date = antes) => ({ id, criadoEm })
const palpite = (usuarioId: string, pontos = 0) => ({ id: `palpite-${usuarioId}`, usuarioId, pontos, jogoId: jogo.id })
const pares = (confrontos: { vencedorId: string; perdedorId: string }[]) =>
  confrontos.map(c => `${c.vencedorId}>${c.perdedorId}`).sort()

describe('Quem é ausente num jogo', () => {
  it('é ausente quem não palpitou e já estava cadastrado', () => {
    // Arrange
    const usuarios = [usuario('user1'), usuario('user2')]

    // Act
    const ausentes = identificarAusentes(jogo, ['user1'], usuarios)

    // Assert
    expect(ausentes).toEqual(['user2'])
  })

  it('não é ausente quem se cadastrou depois do início do jogo', () => {
    const usuarios = [usuario('user1'), usuario('user2', depois)]

    expect(identificarAusentes(jogo, ['user1'], usuarios)).toEqual([])
  })

  it('não é ausente quem se cadastrou exatamente no início do jogo', () => {
    // Por que: a regra pede "cadastrado ANTES do início"; no instante do apito já não dava
    // para palpitar (o bloqueio usa agora >= início), então não há o que penalizar.
    const usuarios = [usuario('user1'), usuario('user2', inicioReal)]

    expect(identificarAusentes(jogo, ['user1'], usuarios)).toEqual([])
  })

  it('é ausente quem se cadastrou 1 ms antes do início real (e não no horário gravado)', () => {
    // Por que: 16:00Z é depois do horário gravado (15:00Z) mas antes do início real (19:00Z).
    // Sem o +4h esse participante escaparia da regra.
    const usuarios = [usuario('user1'), usuario('user2', new Date(inicioReal.getTime() - 1))]

    expect(identificarAusentes(jogo, ['user1'], usuarios)).toEqual(['user2'])
  })
})

describe('Confrontos de ausência', () => {
  it('o ausente perde para todos que palpitaram, inclusive quem fez 0 pontos', () => {
    // Palpitaram: user1 (10 pts) e user2 (0 pts). Ausente: user3.
    // Resultado à mão: user1 → user3 e user2 → user3.
    const usuarios = [usuario('user1'), usuario('user2'), usuario('user3')]
    const palpites = [palpite('user1', 10), palpite('user2', 0)]

    const confrontos = gerarConfrontosDeAusencia(jogo, palpites, usuarios)

    expect(pares(confrontos)).toEqual(['user1>user3', 'user2>user3'])
  })

  it('registra o palpite do vencedor em cada confronto de ausência', () => {
    const confrontos = gerarConfrontosDeAusencia(jogo, [palpite('user1')], [usuario('user1'), usuario('user2')])

    expect(confrontos).toEqual([{ vencedorId: 'user1', perdedorId: 'user2', palpiteId: 'palpite-user1' }])
  })

  it('ausentes não se confrontam entre si', () => {
    // Palpitou só user1. Ausentes: user2 e user3. Resultado à mão: 2 arestas, nenhuma entre 2 e 3.
    const usuarios = [usuario('user1'), usuario('user2'), usuario('user3')]

    const confrontos = gerarConfrontosDeAusencia(jogo, [palpite('user1')], usuarios)

    expect(pares(confrontos)).toEqual(['user1>user2', 'user1>user3'])
  })

  it('jogo sem nenhum palpite não gera confrontos', () => {
    // Todos são ausentes, e ausentes não se confrontam: nenhuma aresta.
    expect(gerarConfrontosDeAusencia(jogo, [], [usuario('user1'), usuario('user2')])).toEqual([])
  })

  it('quem se cadastrou depois do jogo fica de fora, sem vencer nem perder', () => {
    const usuarios = [usuario('user1'), usuario('user2', depois)]

    expect(gerarConfrontosDeAusencia(jogo, [palpite('user1')], usuarios)).toEqual([])
  })
})

describe('Grafo de um jogo com e sem a regra', () => {
  it('soma os confrontos entre palpites e os de ausência', () => {
    // Palpitaram user1 (10), user2 (5) e user3 (5). user4 cadastrado antes, não palpitou.
    // user5 se cadastrou depois do jogo.
    //
    //   Entre palpites: 1>2, 1>3 (2 e 3 empatam: sem aresta)        → 2 arestas
    //   De ausência:    1>4, 2>4, 3>4                                → 3 arestas
    //   Com a regra: 5 arestas. Sem a regra: 2 arestas. user5 nunca aparece.
    const usuarios = [usuario('user1'), usuario('user2'), usuario('user3'), usuario('user4'), usuario('user5', depois)]
    const palpites = [palpite('user1', 10), palpite('user2', 5), palpite('user3', 5)]

    const semRegra = gerarConfrontosDoJogo(palpites)
    const comRegra = [...semRegra, ...gerarConfrontosDeAusenciaDosJogos([jogo], palpites, usuarios)]

    expect(pares(semRegra)).toEqual(['user1>user2', 'user1>user3'])
    expect(pares(comRegra)).toEqual(['user1>user2', 'user1>user3', 'user1>user4', 'user2>user4', 'user3>user4'])
  })

  it('a ausência entra no saldo agregado entre dois jogos', () => {
    // Jogo A: user1 palpitou (0 pts), user2 ausente     → user1 vence user2.
    // Jogo B: os dois palpitaram, user2 fez mais pontos → user2 vence user1.
    // Resultado à mão: com a regra, saldo 1 − 1 = 0 (sem aresta); sem a regra, user2 → user1.
    const jogoA = { id: 'jogoA', dataHora: jogo.dataHora }
    const usuarios = [usuario('user1'), usuario('user2')]
    const palpitesA = [{ id: 'pA1', usuarioId: 'user1', jogoId: 'jogoA' }]
    const palpitesB = [{ id: 'pB1', usuarioId: 'user1', pontos: 0 }, { id: 'pB2', usuarioId: 'user2', pontos: 5 }]

    const semRegra = gerarConfrontosDoJogo(palpitesB)
    const ausencia = gerarConfrontosDeAusenciaDosJogos([jogoA], palpitesA, usuarios)

    expect(agregarSaldo(semRegra)).toEqual([{ vencedorId: 'user2', perdedorId: 'user1', peso: 1 }])
    expect(agregarSaldo([...semRegra, ...ausencia])).toEqual([])
  })
})
