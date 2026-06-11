import { FastifyRequest, FastifyReply } from 'fastify'
import {
  upsertPalpite,
  buscarMeusPalpites,
  buscarPalpitePorJogo,
} from './palpites.service.js'
import type { CriarPalpiteBody } from './palpites.schema.js'
import type { JwtPayload as AuthJwtPayload } from '../auth/auth.schema.js'

// ─── POST /palpites ───────────────────────────────────────────────────────────

export async function salvarPalpiteController(
  request: FastifyRequest<{ Body: CriarPalpiteBody }>,
  reply: FastifyReply
) {
  const { id: usuarioId } = request.user as AuthJwtPayload
  const { erro, status, palpite } = await upsertPalpite(usuarioId, request.body)

  if (erro) {
    return reply.status(status!).send({ error: erro })
  }

  return reply.send(palpite)
}

// ─── GET /palpites/meus ───────────────────────────────────────────────────────

export async function meusPalpitesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id: usuarioId } = request.user as AuthJwtPayload
  const palpites = await buscarMeusPalpites(usuarioId)
  return reply.send(palpites)
}

// ─── GET /palpites/jogo/:jogoId ───────────────────────────────────────────────

export async function palpiteDoJogoController(
  request: FastifyRequest<{ Params: { jogoId: string } }>,
  reply: FastifyReply
) {
  const { id: usuarioId } = request.user as AuthJwtPayload
  const palpite = await buscarPalpitePorJogo(usuarioId, request.params.jogoId)

  if (!palpite) {
    return reply.status(404).send({ error: 'Palpite não encontrado' })
  }

  return reply.send(palpite)
}