import prisma from '../../db/prisma.js'
import { StatusPalpite } from '@prisma/client'
import type { CriarPalpiteBody } from './palpites.schema.js'
import {
  calcularGrupos,
  calcularMataMata,
  verificarJogoAberto,
  verificarLimiteEdicoes,
} from './palpites.regras.js'

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

  const impedimento = verificarJogoAberto(jogo, new Date())
  if (impedimento) return { erro: impedimento.erro, status: impedimento.status }

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

  if (palpiteExistente) {
    const limite = verificarLimiteEdicoes(palpiteExistente.totalEdicoes)
    if (limite) return { erro: limite.erro, status: limite.status }
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
