import { describe, expect, it } from 'vitest'
import { verificarJogoAberto, verificarLimiteEdicoes } from '../../src/modules/palpites/palpites.regras.js'

// Regras de palpite:
//   1. Só se palpita em jogo com status liberado e antes do início.
//   2. Cada palpite pode ser editado no máximo 2 vezes (a criação não conta como edição).
//
// Sobre o horário: o banco guarda o horário LOCAL de Manaus (UTC-4) como se fosse UTC.
// O início real é, portanto, o valor gravado + 4 horas. Nos testes abaixo:
//   gravado  = 2026-06-11T15:00:00Z  →  início real = 2026-06-11T19:00:00Z
const dataHoraGravada = new Date('2026-06-11T15:00:00.000Z')
const inicioReal = new Date('2026-06-11T19:00:00.000Z')
const jogoAgendado = { status: 'AGENDADO', dataHora: dataHoraGravada }
const msApos = (data: Date, ms: number) => new Date(data.getTime() + ms)

describe('Bloqueio de palpite no início do jogo', () => {
  it('permite palpitar 1 ms antes do início', () => {
    // Arrange
    const agora = msApos(inicioReal, -1)

    // Act
    const impedimento = verificarJogoAberto(jogoAgendado, agora)

    // Assert
    expect(impedimento).toBeNull()
  })

  it('bloqueia exatamente no horário de início', () => {
    // Por que: a regra é "agora >= início"; no instante do apito o prazo já acabou.
    expect(verificarJogoAberto(jogoAgendado, inicioReal)).toEqual({
      erro: 'Prazo de palpite encerrado — o jogo já começou',
      status: 403,
    })
  })

  it('bloqueia 1 ms depois do início', () => {
    expect(verificarJogoAberto(jogoAgendado, msApos(inicioReal, 1))).toEqual({
      erro: 'Prazo de palpite encerrado — o jogo já começou',
      status: 403,
    })
  })

  it('ainda permite palpitar no horário gravado, porque o início real é 4 horas depois', () => {
    // Por que: documenta o deslocamento de +4h. Sem ele, este instante já estaria bloqueado.
    expect(verificarJogoAberto(jogoAgendado, dataHoraGravada)).toBeNull()
  })

  it('bloqueia jogo com status BLOQUEADO mesmo antes do início', () => {
    const jogo = { status: 'BLOQUEADO', dataHora: dataHoraGravada }

    expect(verificarJogoAberto(jogo, msApos(inicioReal, -60_000))).toEqual({
      erro: 'Jogo bloqueado — aguarde a liberação da fase',
      status: 403,
    })
  })

  it.each(['EM_ANDAMENTO', 'ENCERRADO'])('bloqueia jogo com status %s mesmo antes do horário', (status) => {
    // Por que: o status vale mesmo se o relógio ainda indicar prazo aberto
    // (por exemplo, quando o admin encerra o jogo manualmente).
    const jogo = { status, dataHora: dataHoraGravada }

    expect(verificarJogoAberto(jogo, msApos(inicioReal, -60_000))).toEqual({
      erro: 'Palpites encerrados para esse jogo',
      status: 403,
    })
  })
})

describe('Limite de 2 edições por palpite', () => {
  it.each([0, 1])('permite editar um palpite com %i edição(ões) feita(s)', (totalEdicoes) => {
    expect(verificarLimiteEdicoes(totalEdicoes)).toBeNull()
  })

  it('bloqueia a terceira alteração, quando o palpite já foi editado 2 vezes', () => {
    expect(verificarLimiteEdicoes(2)).toEqual({
      erro: 'Limite de edições atingido — você só pode alterar seu palpite 2 vezes',
      status: 403,
    })
  })

  it('continua bloqueando acima do limite', () => {
    // Borda defensiva: o código usa ">= 2", então valores maiores também bloqueiam.
    expect(verificarLimiteEdicoes(5)).not.toBeNull()
  })
})
