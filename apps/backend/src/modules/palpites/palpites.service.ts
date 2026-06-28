import prisma from '../../db/prisma.js'
import { StatusPalpite } from '@prisma/client'
import type { CriarPalpiteBody } from './palpites.schema.js'

// ─── Select padrão de palpite

const palpiteSelect = {
  id: true,
  jogoId: true,
  golsCasa: true,
  golsVisitante: true,
  pontos: true,
  status: true,
  criadoEm: true,
  atualizadoEm: true,
  totalEdicoes: true,
  jogo: {
    select: {
      id: true,
      rodada: true,
      grupo: true,
      dataHora: true,
      timeCasaRef: true,
      timeVisitanteRef: true,
      timeCasa:      { select: { nome: true } },
      timeVisitante: { select: { nome: true } },
    },
  },
}

// ─── Valida se o jogo existe e está aberto para palpites

async function validarJogo(jogoId: string) {
  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    select: { id: true, status: true, dataHora: true },
  })

  if (!jogo) {
    return { erro: 'Jogo não encontrado', status: 404 }
  }

  if (jogo.status === 'BLOQUEADO') {
    return { erro: 'Jogo bloqueado — aguarde a liberação da fase', status: 403 }
  }

  if (jogo.status === 'ENCERRADO' || jogo.status === 'EM_ANDAMENTO') {
    return { erro: 'Palpites encerrados para esse jogo', status: 403 }
  }
  
  const inicioUtcReal = new Date(new Date(jogo.dataHora).getTime() + 4 * 60 * 60 * 1000)

  if (new Date() >= inicioUtcReal) {
    return { erro: 'Prazo de palpite encerrado — o jogo já começou', status: 403 }
  }

  return { jogo }
}

// ─── Cria ou atualiza palpite (upsert)

export async function upsertPalpite(usuarioId: string, body: CriarPalpiteBody) {
  const validacao = await validarJogo(body.jogoId)
  if (validacao.erro) {
    return { erro: validacao.erro, status: validacao.status }
  }

  const palpiteExistente = await prisma.palpite.findUnique({
    where: {
      usuarioId_jogoId: { usuarioId, jogoId: body.jogoId },
    },
    select: { id: true, totalEdicoes: true },
  })

  if (palpiteExistente && palpiteExistente.totalEdicoes >= 2) {
    return {
      erro: 'Limite de edições atingido — você só pode alterar seu palpite 2 vezes',
      status: 403,
    }
  }

  const palpite = await prisma.palpite.upsert({
    where: {
      usuarioId_jogoId: { usuarioId, jogoId: body.jogoId },
    },
    update: {
      golsCasa: body.golsCasa,
      golsVisitante: body.golsVisitante,
      vencedorPenalti: body.vencedorPenalti ?? null,
      totalEdicoes: { increment: 1 },
    },
    create: {
      usuarioId,
      jogoId: body.jogoId,
      golsCasa: body.golsCasa,
      golsVisitante: body.golsVisitante,
      vencedorPenalti: body.vencedorPenalti ?? null,
      totalEdicoes: 0,
    },
    select: palpiteSelect,
  })

  return { palpite }
}

// ─── Busca todos os palpites do usuário

export async function buscarMeusPalpites(usuarioId: string) {
  return prisma.palpite.findMany({
    where: { usuarioId },
    select: palpiteSelect,
    orderBy: { jogo: { dataHora: 'asc' } },
  })
}

// ─── Busca palpite do usuário em um jogo específico

export async function buscarPalpitePorJogo(usuarioId: string, jogoId: string) {
  return prisma.palpite.findUnique({
    where: {
      usuarioId_jogoId: { usuarioId, jogoId },
    },
    select: palpiteSelect,
  })
}

// ─── Calcula e atualiza pontuação de todos os palpites de um jogo

export async function calcularPontuacaoJogo(jogoId: string) {
  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    select: {
      fase: true,
      resultado: { select: { golsCasa: true, golsVisitante: true, penalti: true, vencedorPenalti: true } },
    },
  })

  if (!jogo?.resultado) return

  const { resultado, fase } = jogo
  const isMataMata = fase !== 'GRUPOS'

  const palpites = await prisma.palpite.findMany({
    where: { jogoId },
    select: { id: true, golsCasa: true, golsVisitante: true, vencedorPenalti: true },
  })

  for (const palpite of palpites) {
    let pontos: number
    let status: StatusPalpite

    if (isMataMata) {
      ({ pontos, status } = calcularMataMata(palpite, resultado))
    } else {
      ({ pontos, status } = calcularGrupos(palpite, resultado))
    }

    await prisma.palpite.update({
      where: { id: palpite.id },
      data: { pontos, status },
    })
  }
}

// ─── Fase de grupos: 10 exato / 5+2 bônus vencedor / 0

function calcularGrupos(
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

function calcularMataMata(
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

function ganhouPontoExtra(
  palpite: { golsCasa: number; golsVisitante: number },
  resultado: { golsCasa: number; golsVisitante: number }
): number {
  return (
    palpite.golsCasa === resultado.golsCasa ||
    palpite.golsVisitante === resultado.golsVisitante ||
    (palpite.golsCasa - palpite.golsVisitante) === (resultado.golsCasa - resultado.golsVisitante)
  ) ? 2 : 0
}