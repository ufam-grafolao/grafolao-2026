import { FastifyRequest, FastifyReply } from 'fastify'
import {
  inserirResultado,
  atualizarStatusJogo,
  buscarJogosPendentes,
  buscarEstatisticas,
} from './admin.service.js'
import type { InserirResultadoBody, AtualizarStatusBody } from './admin.schema.js'
import type { JwtPayload } from '../auth/auth.schema.js'

// ─── POST /admin/jogos/:id/resultado ─────────────────────────────────────────

export async function inserirResultadoController(
  request: FastifyRequest<{
    Params: { id: string }
    Body: InserirResultadoBody
  }>,
  reply: FastifyReply
) {
  const { id: adminId } = request.user as JwtPayload
  const { erro, status, resultado } = await inserirResultado(
    request.params.id,
    adminId,
    request.body
  )

  if (erro) {
    return reply.status(status!).send({ error: erro })
  }

  return reply.send(resultado)
}

// ─── PATCH /admin/jogos/:id/status ───────────────────────────────────────────

export async function atualizarStatusController(
  request: FastifyRequest<{
    Params: { id: string }
    Body: AtualizarStatusBody
  }>,
  reply: FastifyReply
) {
  const { erro, status, jogo } = await atualizarStatusJogo(
    request.params.id,
    request.body
  )

  if (erro) {
    return reply.status(status!).send({ error: erro })
  }

  return reply.send(jogo)
}

// ─── GET /admin/jogos/pendentes ───────────────────────────────────────────────

export async function jogosPendentesController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const jogos = await buscarJogosPendentes()
  return reply.send(jogos)
}

// ─── GET /admin/stats ─────────────────────────────────────────────────────────

export async function estatisticasController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const stats = await buscarEstatisticas()
  return reply.send(stats)
}