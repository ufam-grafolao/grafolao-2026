import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { getCliquesController } from './cliques.contoller.js'
import { cliquesResponseSchema } from './cliques.schema.js'

export async function cliquesRoutes(app: FastifyInstance) {
  // Salva ou edita palpite (upsert)
  app.get('/cliques', {
    preHandler: [app.authenticate],
    schema: {
      response: cliquesResponseSchema,
    },
  }, getCliquesController)
}
