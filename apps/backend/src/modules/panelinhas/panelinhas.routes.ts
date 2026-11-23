import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { panelinhasController, seriePanelinhasController } from './panelinhas.controller.js'
import { panelinhasResponseSchema, serieResponseSchema } from './panelinhas.schema.js'

export async function panelinhasRoutes(app: FastifyInstance) {
  // Grafo de similaridade + panelas, acumulado até a rodada pedida (ou o campeonato todo)
  app.get('/grafos/panelinhas', {
    preHandler: [app.authenticate],
    schema: { response: panelinhasResponseSchema },
  }, panelinhasController as RouteHandlerMethod)

  // Série por rodada acumulada: tamanho da maior panela e média das top-k
  app.get('/grafos/panelinhas/serie', {
    preHandler: [app.authenticate],
    schema: { response: serieResponseSchema },
  }, seriePanelinhasController as RouteHandlerMethod)
}
