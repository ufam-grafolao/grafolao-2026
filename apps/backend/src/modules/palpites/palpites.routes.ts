import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import {
  salvarPalpiteController,
  meusPalpitesController,
  palpiteDoJogoController,
} from './palpites.controller.js'
import {
  criarPalpiteBodySchema,
  palpiteResponseSchema,
  meusAlpitesResponseSchema,
} from './palpites.schema.js'

export async function palpitesRoutes(app: FastifyInstance) {
  // Salva ou edita palpite (upsert)
  app.post('/palpites', {
    preHandler: [app.authenticate],
    schema: {
      ...criarPalpiteBodySchema,
      response: palpiteResponseSchema,
    },
  }, salvarPalpiteController as RouteHandlerMethod)

  // Lista todos os palpites do usuário logado
  app.get('/palpites/meus', {
    preHandler: [app.authenticate],
    schema: {
      response: meusAlpitesResponseSchema,
    },
  }, meusPalpitesController)

  // Palpite do usuário em um jogo específico
  app.get('/palpites/jogo/:jogoId', {
    preHandler: [app.authenticate],
    schema: {
      response: palpiteResponseSchema,
    },
  }, palpiteDoJogoController as RouteHandlerMethod)
}