import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { encontrarPanelinhasMaximais } from './cliques.service.js'

// ─── GET /cliques

export async function getCliquesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const cliques = await encontrarPanelinhasMaximais(true)
  return reply.send(cliques)
}