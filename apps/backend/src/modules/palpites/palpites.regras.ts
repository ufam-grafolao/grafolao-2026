import type { StatusPalpite } from '@prisma/client'

// Regras puras de palpites (sem Prisma, sem relógio): recebem dados e devolvem decisões.
// Ficam separadas do service para poderem ser testadas sem banco de dados.

// ─── Fase de grupos: 10 exato / 5+2 bônus vencedor / 0

export function calcularGrupos(
  palpite: { golsCasa: number; golsVisitante: number },
  resultado: { golsCasa: number; golsVisitante: number }
): { pontos: number; status: StatusPalpite } {
  const acertouPlacar =
    palpite.golsCasa === resultado.golsCasa &&
    palpite.golsVisitante === resultado.golsVisitante

  const acertouResultado =
    Math.sign(palpite.golsCasa - palpite.golsVisitante) ===
    Math.sign(resultado.golsCasa - resultado.golsVisitante)

  if (acertouPlacar) return { pontos: 10, status: 'ACERTO_PLACAR' }
  if (acertouResultado) {
    const bonus = ganhouPontoExtra(palpite, resultado)
    return { pontos: 5 + bonus, status: 'ACERTO_VENCEDOR' }
  }
  return { pontos: 0, status: 'ERRO' }
}

export function calcularMataMata(
  palpite: { golsCasa: number; golsVisitante: number; vencedorPenalti: string | null },
  resultado: { golsCasa: number; golsVisitante: number; penalti: boolean; vencedorPenalti: string | null }
): { pontos: number; status: StatusPalpite } {
  const acertouPlacar =
    palpite.golsCasa === resultado.golsCasa &&
    palpite.golsVisitante === resultado.golsVisitante

  // Placar exato: +5 se acertou pênalti
  if (acertouPlacar) {
    if (resultado.penalti && palpite.vencedorPenalti === resultado.vencedorPenalti) {
      return { pontos: 20, status: 'ACERTO_PLACAR' }
    }
    return { pontos: 15, status: 'ACERTO_PLACAR' }
  }

  const palpiteEmpate = palpite.golsCasa === palpite.golsVisitante

  // Jogo decidido nos pênaltis
  if (resultado.penalti) {
    if (!palpiteEmpate) {
      // Palpitou vencedor claro mas o jogo foi empate → errou o resultado
      return { pontos: 0, status: 'ERRO' }
    }
    // Palpitou empate: bônus de saldo obrigatório (saldo = 0), +5 se acertou o vencedor
    if (palpite.vencedorPenalti === resultado.vencedorPenalti) {
      return { pontos: 15, status: 'ACERTO_VENCEDOR' }
    }
    return { pontos: 10, status: 'ACERTO_BONUS' }
  }

  // Jogo decidido sem pênaltis — acertou quem ganhou?
  const vencedorReal = resultado.golsCasa > resultado.golsVisitante ? 'CASA' : 'VISITANTE'

  const vencedorPalpite = palpite.golsCasa > palpite.golsVisitante
    ? 'CASA'
    : palpite.golsCasa < palpite.golsVisitante
      ? 'VISITANTE'
      : null // palpiteEmpate mas jogo foi decidido sem pênaltis → erro

  if (vencedorPalpite !== vencedorReal) return { pontos: 0, status: 'ERRO' }

  const bonus = ganhouPontoExtra(palpite, resultado)
  if (bonus > 0) return { pontos: 10, status: 'ACERTO_VENCEDOR' }
  return { pontos: 7, status: 'ACERTO_VENCEDOR' }
}

export function ganhouPontoExtra(
  palpite: { golsCasa: number; golsVisitante: number },
  resultado: { golsCasa: number; golsVisitante: number }
): number {
  return (
    palpite.golsCasa === resultado.golsCasa ||
    palpite.golsVisitante === resultado.golsVisitante ||
    (palpite.golsCasa - palpite.golsVisitante) === (resultado.golsCasa - resultado.golsVisitante)
  ) ? 2 : 0
}

// ─── Prazo e status do jogo: decide se ainda se pode palpitar

export function verificarJogoAberto(
  jogo: { status: string; dataHora: Date },
  agora: Date
): { erro: string; status: number } | null {
  if (jogo.status === 'BLOQUEADO') {
    return { erro: 'Jogo bloqueado — aguarde a liberação da fase', status: 403 }
  }

  if (jogo.status === 'ENCERRADO' || jogo.status === 'EM_ANDAMENTO') {
    return { erro: 'Palpites encerrados para esse jogo', status: 403 }
  }

  // Por que +4h: o seed grava o horário local de Manaus (UTC-4, arquivo copa2026.utc4.json)
  // como se fosse UTC. O instante real do início é, portanto, o valor gravado + 4 horas.
  const inicioUtcReal = new Date(new Date(jogo.dataHora).getTime() + 4 * 60 * 60 * 1000)

  if (agora >= inicioUtcReal) {
    return { erro: 'Prazo de palpite encerrado — o jogo já começou', status: 403 }
  }

  return null
}

// ─── Limite de edições: o palpite só pode ser alterado 2 vezes

export function verificarLimiteEdicoes(totalEdicoes: number): { erro: string; status: number } | null {
  if (totalEdicoes >= 2) {
    return {
      erro: 'Limite de edições atingido — você só pode alterar seu palpite 2 vezes',
      status: 403,
    }
  }
  return null
}
