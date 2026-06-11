import { FastifyInstance } from 'fastify'
import {
  listarJogosController,
  jogosHojeController,
  detalheJogoController,
  jogosPorTimeController,
} from './jogos.controller.js'
import {
  jogosResponseSchema,
  jogoResponseSchema,
  jogosQuerySchema,
} from './jogos.schema.js'
import type { JogosQueryParams } from './jogos.schema.js'

export async function jogosRoutes(app: FastifyInstance) {
  // Lista todos os jogos com filtros opcionais
  app.get<{ Querystring: JogosQueryParams }>('/jogos', {
    preHandler: [app.authenticate],
    schema: {
      ...jogosQuerySchema,
      response: jogosResponseSchema,
    },
  }, listarJogosController)

  // Jogos do dia atual
  app.get('/jogos/hoje', {
    preHandler: [app.authenticate],
    schema: {
      response: jogosResponseSchema,
    },
  }, jogosHojeController)

  // Detalhe de um jogo
  app.get<{ Params: { id: string } }>('/jogos/:id', {
    preHandler: [app.authenticate],
    schema: {
      response: jogoResponseSchema,
    },
  }, detalheJogoController)

  app.get<{ Params: { timeId: string } }>('/jogos/time/:timeId', {
    preHandler: [app.authenticate],
    schema: {
        response: jogosResponseSchema,
    },
  }, jogosPorTimeController)
}