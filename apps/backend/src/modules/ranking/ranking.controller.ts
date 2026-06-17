import { FastifyRequest, FastifyReply } from 'fastify'
import { rankingGeral } from './ranking.service.js'
import type { RankingQuerystring } from './ranking.schema.js'
import type { JwtPayload as AuthJwtPayload } from '../auth/auth.schema.js'

export async function rankingGeralController(
  request: FastifyRequest<{ Querystring: RankingQuerystring }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const page  = Number(request.query.page  ?? 1)
    const limit = Number(request.query.limit ?? 20)
    const resultado = await rankingGeral(page, limit, usuarioId)
    return reply.send(resultado)
  } catch (e) {
    request.log.error(e)
    return reply.status(500).send({ error: 'ERRO_INTERNO' })
  }
}
