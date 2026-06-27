import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import {
  configPalpitesEspeciaisController,
  meusPalpitesEspeciaisController,
  resultadosEspeciaisController,
  salvarPalpiteEspecialController,
  inserirResultadoEspecialController,
} from './palpites-especiais.controller.js'
import {
  meusPalpitesEspeciaisResponseSchema,
  resultadosEspeciaisResponseSchema,
  salvarPalpiteEspecialResponseSchema,
  bodySalvarPalpiteEspecialSchema,
} from './palpites-especiais.schema.js'

export async function palpitesEspeciaisRoutes(app: FastifyInstance) {
  app.get('/palpites-especiais/config', {
    preHandler: [app.authenticate],
    schema: { response: { 200: { type: 'object', properties: { prazo: { type: 'string' } } } } },
  }, configPalpitesEspeciaisController as RouteHandlerMethod)

  app.get('/palpites-especiais/meus', {
    preHandler: [app.authenticate],
    schema: { response: meusPalpitesEspeciaisResponseSchema },
  }, meusPalpitesEspeciaisController as RouteHandlerMethod)

  app.get('/palpites-especiais/resultados', {
    preHandler: [app.authenticate],
    schema: { response: resultadosEspeciaisResponseSchema },
  }, resultadosEspeciaisController as RouteHandlerMethod)

  app.post('/palpites-especiais', {
    preHandler: [app.authenticate],
    schema: { body: bodySalvarPalpiteEspecialSchema, response: salvarPalpiteEspecialResponseSchema },
  }, salvarPalpiteEspecialController as RouteHandlerMethod)

  app.post('/admin/palpites-especiais/resultado', {
    preHandler: [app.authenticate],
  }, inserirResultadoEspecialController as RouteHandlerMethod)
}