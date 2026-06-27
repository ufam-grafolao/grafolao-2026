import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { listarTimesController } from './times.controller.js'
import { timesResponseSchema } from './times.schema.js'

export async function timesRoutes(app: FastifyInstance) {
  app.get('/times', {
    preHandler: [app.authenticate],
    schema: { response: timesResponseSchema },
  }, listarTimesController as RouteHandlerMethod)
}
