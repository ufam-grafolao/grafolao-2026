import prisma from '../../db/prisma.js'
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
      totalEdicoes: { increment: 1 },
    },
    create: {
      usuarioId,
      jogoId: body.jogoId,
      golsCasa: body.golsCasa,
      golsVisitante: body.golsVisitante,
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
// Chamado pelo módulo de resultados quando admin insere o resultado real

export async function calcularPontuacaoJogo(jogoId: string) {
  const resultado = await prisma.resultado.findUnique({
    where: { jogoId },
    select: { golsCasa: true, golsVisitante: true },
  })

  if (!resultado) return

  const palpites = await prisma.palpite.findMany({
    where: { jogoId },
    select: { id: true, golsCasa: true, golsVisitante: true },
  })

  const resultadoCasaVence  = resultado.golsCasa > resultado.golsVisitante
  const resultadoEmpate     = resultado.golsCasa === resultado.golsVisitante
  const resultadoVisitanteVence = resultado.golsCasa < resultado.golsVisitante

  for (const palpite of palpites) {
    const acertouPlacar =
      palpite.golsCasa      === resultado.golsCasa &&
      palpite.golsVisitante === resultado.golsVisitante

    const palpiteCasaVence      = palpite.golsCasa > palpite.golsVisitante
    const palpiteEmpate         = palpite.golsCasa === palpite.golsVisitante
    const palpiteVisitanteVence = palpite.golsCasa < palpite.golsVisitante

    const acertouResultado =
      (resultadoCasaVence      && palpiteCasaVence)      ||
      (resultadoEmpate         && palpiteEmpate)         ||
      (resultadoVisitanteVence && palpiteVisitanteVence)

    const pontos = acertouPlacar ? 10 
    : acertouResultado ? 5 + ganhouPontoExtra(palpite, resultado)
    : 0
    const status = acertouPlacar
      ? 'ACERTO_PLACAR'
      : acertouResultado
      ? 'ACERTO_VENCEDOR'
      : 'ERRO'

    await prisma.palpite.update({
      where: { id: palpite.id },
      data: { pontos, status },
    })
  }
}

function ganhouPontoExtra(palpite: { golsCasa: number; golsVisitante: number }, resultado: { golsCasa: number; golsVisitante: number }): number {
  return ((palpite.golsCasa === resultado.golsCasa) || // acertou gols casa
    (palpite.golsVisitante === resultado.golsVisitante) || // acertou gols visitante
    ((palpite.golsCasa - palpite.golsVisitante) === (resultado.golsCasa - resultado.golsVisitante)) ? // acertou saldo de gols
    2 : 0
  )
}