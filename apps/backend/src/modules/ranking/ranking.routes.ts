import { FastifyInstance } from 'fastify'
import { rankingGeralController } from './ranking.controller.js'
import { rankingGeralResponseSchema, rankingGeralQuerySchema, type RankingQuerystring } from './ranking.schema.js'

export async function rankingRoutes(app: FastifyInstance) {
  app.get<{ Querystring: RankingQuerystring }>('/ranking/geral', {
    preHandler: [app.authenticate],
    schema: {
      ...rankingGeralQuerySchema,
      response: rankingGeralResponseSchema,
    },
  }, rankingGeralController)
}
