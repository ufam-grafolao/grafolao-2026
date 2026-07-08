import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { getCliquesController } from './cliques.contoller.js'
import { cliquesQuerySchema, cliquesResponseSchema } from './cliques.schema.js'

export async function cliquesRoutes(app: FastifyInstance) {
  // Salva ou edita palpite (upsert)
  app.get('/cliques', {
    preHandler: [app.authenticate],
    schema: {
      querystring: cliquesQuerySchema,
      response: cliquesResponseSchema,
    },
  }, getCliquesController as RouteHandlerMethod)
}
