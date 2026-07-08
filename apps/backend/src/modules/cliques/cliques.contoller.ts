import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { encontrarPanelinhasMaximais } from './cliques.service.js'
import { CliquesQueryParams } from './cliques.schema.js'
import { JwtPayload } from '../auth/auth.schema.js';

// ─── GET /cliques

export async function getCliquesController(
  request: FastifyRequest<{ Querystring: CliquesQueryParams }>,
  reply: FastifyReply
) {
  const { id } = request.user! as JwtPayload;

  const cliques = await encontrarPanelinhasMaximais(
    request.query.ordem,
    request.query.minimoUsuarios,
    request.query.minimoJogos,
    request.query.comigo ? id : undefined,
    request.query.comJogo
  );

  return reply.send(cliques)
}