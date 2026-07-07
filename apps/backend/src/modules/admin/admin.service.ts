import prisma from '../../db/prisma.js'
import { calcularPontuacaoJogo } from '../palpites/palpites.service.js'
import { enviarParaTodos } from '../push/push.service.js'
import { getNomePt } from '../../shared/utils/nomes-times.js'
import type { InserirResultadoBody, AtualizarStatusBody } from './admin.schema.js'
import { construirConfrontosJogo } from '../grafo-confrontos/grafo-confrontos.service.js'

// ─── Propaga vencedor para o próximo confronto do mata-mata ──────────────────

async function propagarVencedor(
  jogoId: string,
  body: InserirResultadoBody,
  penalti: boolean,
  vencedorPenalti: string | null
) {
  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    select: { num: true, timeCasaId: true, timeVisitanteId: true },
  })

  if (!jogo?.num) return

  let vencedorId: string | null = null

  if (penalti) {
    vencedorId = vencedorPenalti === 'CASA' ? jogo.timeCasaId : jogo.timeVisitanteId
  } else if (body.golsCasa > body.golsVisitante) {
    vencedorId = jogo.timeCasaId
  } else if (body.golsVisitante > body.golsCasa) {
    vencedorId = jogo.timeVisitanteId
  }

  if (!vencedorId) return

  const ref = `W${jogo.num}`

  await Promise.all([
    prisma.jogo.updateMany({ where: { timeCasaRef: ref },      data: { timeCasaId: vencedorId } }),
    prisma.jogo.updateMany({ where: { timeVisitanteRef: ref }, data: { timeVisitanteId: vencedorId } }),
  ])
}

// ─── Insere ou atualiza resultado de um jogo ──────────────────────────────────

export async function inserirResultado(
  jogoId: string,
  adminId: string,
  body: InserirResultadoBody
) {
  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    select: { id: true, status: true },
  })

  if (!jogo) {
    return { erro: 'Jogo não encontrado', status: 404 }
  }

  if (jogo.status === 'BLOQUEADO') {
    return { erro: 'Jogo bloqueado — libere a fase antes de inserir resultado', status: 403 }
  }

  // Cria ou atualiza o resultado
  const dadosPenalti = body.penalti && body.golsCasa === body.golsVisitante
    ? { penalti: true, vencedorPenalti: body.vencedorPenalti ?? null }
    : { penalti: false, vencedorPenalti: null }

  const resultado = await prisma.resultado.upsert({
    where: { jogoId },
    update: {
      golsCasa:      body.golsCasa,
      golsVisitante: body.golsVisitante,
      ...dadosPenalti,
      artilheirosCasa:      body.artilheirosCasa      ?? [],
      artilheirosVisitante: body.artilheirosVisitante ?? [],
      cartoesAmarelos:             body.cartoesAmarelos             ?? 0,
      cartoesVermelhosIndiretos:   body.cartoesVermelhosIndiretos   ?? 0,
      cartoesVermelhosDiretos:     body.cartoesVermelhosDiretos     ?? 0,
      cartoesAmarelosMaisVermelho: body.cartoesAmarelosMaisVermelho ?? 0,
      inseridoPor: adminId,
    },
    create: {
      jogoId,
      golsCasa:      body.golsCasa,
      golsVisitante: body.golsVisitante,
      ...dadosPenalti,
      artilheirosCasa:      body.artilheirosCasa      ?? [],
      artilheirosVisitante: body.artilheirosVisitante ?? [],
      cartoesAmarelos:             body.cartoesAmarelos             ?? 0,
      cartoesVermelhosIndiretos:   body.cartoesVermelhosIndiretos   ?? 0,
      cartoesVermelhosDiretos:     body.cartoesVermelhosDiretos     ?? 0,
      cartoesAmarelosMaisVermelho: body.cartoesAmarelosMaisVermelho ?? 0,
      inseridoPor: adminId,
    },
  })

  await prisma.jogo.update({
    where: { id: jogoId },
    data: { status: 'ENCERRADO' },
  })

  await calcularPontuacaoJogo(jogoId)
  await construirConfrontosJogo(jogoId)

  // Propaga o vencedor para o próximo confronto do mata-mata
  await propagarVencedor(jogoId, body, dadosPenalti.penalti, dadosPenalti.vencedorPenalti)

  // Notifica usuários sobre o resultado
  const jogoComTimes = await prisma.jogo.findUnique({
    where: { id: jogoId },
    include: {
      timeCasa:      { select: { nome: true } },
      timeVisitante: { select: { nome: true } },
    },
  })
  if (jogoComTimes) {
    const casa      = getNomePt(jogoComTimes.timeCasa?.nome      ?? jogoComTimes.timeCasaRef      ?? '?')
    const visitante = getNomePt(jogoComTimes.timeVisitante?.nome ?? jogoComTimes.timeVisitanteRef ?? '?')
    enviarParaTodos({
      title: `🏁 Resultado: ${casa} ${body.golsCasa} x ${body.golsVisitante} ${visitante}`,
      body:  'O resultado foi publicado. Confira sua pontuação!',
      url:   '/meus-palpites',
    }).catch(() => {})
  }

  return { resultado }
}

// ─── Atualiza status de um jogo ───────────────────────────────────────────────

export async function atualizarStatusJogo(
  jogoId: string,
  body: AtualizarStatusBody
) {
  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    select: { id: true },
  })

  if (!jogo) {
    return { erro: 'Jogo não encontrado', status: 404 }
  }

  const atualizado = await prisma.jogo.update({
    where: { id: jogoId },
    data: { status: body.status },
    select: { id: true, status: true },
  })

  return { jogo: atualizado }
}

// ─── Estatísticas gerais (admin) ──────────────────────────────────────────────

export async function buscarEstatisticas() {
  const [totalUsuarios, totalPalpites, totalEspeciais, porUsuario] = await Promise.all([
    prisma.usuario.count({ where: { ativo: true } }),
    prisma.palpite.count(),
    prisma.palpiteEspecial.count(),
    prisma.usuario.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        email: true,
        avatarUrl: true,
        _count: { select: { palpites: true, palpitesEspeciais: true } },
      },
      orderBy: { nome: 'asc' },
    }),
  ])

  const palpitesPorUsuario = porUsuario
    .map(u => ({
      usuarioId:  u.id,
      nome:       u.nome,
      email:      u.email,
      avatarUrl:  u.avatarUrl,
      palpites:   u._count.palpites,
      especiais:  u._count.palpitesEspeciais,
      total:      u._count.palpites + u._count.palpitesEspeciais,
    }))
    .sort((a, b) => b.total - a.total)

  return { totalUsuarios, totalPalpites, totalEspeciais, palpitesPorUsuario }
}

// ─── Assinantes de push notification ─────────────────────────────────────────

export async function buscarAssinantesNotificacao() {
  const assinantes = await prisma.pushSubscription.findMany({
    select: {
      id: true,
      endpoint: true,
      criadoEm: true,
      usuario: {
        select: { id: true, nome: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { criadoEm: 'desc' },
  })

  return {
    total: assinantes.length,
    assinantes: assinantes.map(s => ({
      subscriptionId: s.id,
      criadoEm:       s.criadoEm,
      usuario:        s.usuario,
    })),
  }
}

// ─── Lista jogos sem resultado (pendentes) ────────────────────────────────────

export async function buscarJogosPendentes() {
  return prisma.jogo.findMany({
    where: {
      status: { in: ['AGENDADO', 'EM_ANDAMENTO'] },
      resultado: null,
    },
    select: {
      id: true,
      rodada: true,
      grupo: true,
      dataHora: true,
      local: true,
      status: true,
      timeCasa:      { select: { nome: true } },
      timeVisitante: { select: { nome: true } },
      timeCasaRef: true,
      timeVisitanteRef: true,
    },
    orderBy: { dataHora: 'asc' },
  })
}