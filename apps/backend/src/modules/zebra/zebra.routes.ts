import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import {
  detalheJogoZebraController,
  mstAgregadaController,
  rankingZebraController,
} from './zebra.controller.js'
import {
  detalheJogoZebraResponseSchema,
  mstAgregadaResponseSchema,
  rankingZebraResponseSchema,
} from './zebra.schema.js'

export async function zebraRoutes(app: FastifyInstance) {
  // Ranking do Índice de Zebra (ousadia × pontos)
  app.get('/grafos/zebra/ranking', {
    preHandler: [app.authenticate],
    schema: { response: rankingZebraResponseSchema },
  }, rankingZebraController as RouteHandlerMethod)

  // MST do grafo agregado (distância média nos jogos em comum), para as bolhas
  app.get('/grafos/zebra/mst', {
    preHandler: [app.authenticate],
    schema: { response: mstAgregadaResponseSchema },
  }, mstAgregadaController as RouteHandlerMethod)

  // Detalhe de um jogo encerrado: MST do jogo e os ousados que acertaram
  app.get('/grafos/zebra/jogos/:jogoId', {
    preHandler: [app.authenticate],
    schema: { response: detalheJogoZebraResponseSchema },
  }, detalheJogoZebraController as RouteHandlerMethod)
}
