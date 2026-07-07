import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import {
  grafoConfrontosController,
  ciclosController,
  caminhoMaisLongoController,
  evolucaoController,
} from './grafo-confrontos.controller.js'
import {
  grafoConfrontosResponseSchema,
  ciclosResponseSchema,
  caminhoMaisLongoResponseSchema,
} from './grafo-confrontos.schema.js'

export async function grafoConfrontosRoutes(app: FastifyInstance) {
  // Grafo completo (acumulado ou por rodada via query param)
  app.get('/grafos/confrontos', {
    preHandler: [app.authenticate],
    schema: { response: grafoConfrontosResponseSchema },
  }, grafoConfrontosController as RouteHandlerMethod)

  // Ciclos detectados
  app.get('/grafos/confrontos/ciclos', {
    preHandler: [app.authenticate],
    schema: { response: ciclosResponseSchema },
  }, ciclosController as RouteHandlerMethod)

  // Caminho mais longo de vitórias
  app.get('/grafos/confrontos/caminho-mais-longo', {
    preHandler: [app.authenticate],
    schema: { response: caminhoMaisLongoResponseSchema },
  }, caminhoMaisLongoController as RouteHandlerMethod)

  // Evolução do PageRank rodada a rodada (para gráficos)
  app.get('/grafos/confrontos/evolucao', {
    preHandler: [app.authenticate],
  }, evolucaoController as RouteHandlerMethod)
}