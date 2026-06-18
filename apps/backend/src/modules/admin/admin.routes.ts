import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import {
  inserirResultadoController,
  atualizarStatusController,
  jogosPendentesController,
  estatisticasController,
  assinantesNotificacaoController,
} from './admin.controller.js'
import {
  inserirResultadoBodySchema,
  atualizarStatusBodySchema,
} from './admin.schema.js'
import { apenasAdmin } from '../../shared/middlewares/auth.middleware.js'

export async function adminRoutes(app: FastifyInstance) {
  // Insere ou atualiza resultado de um jogo + calcula pontuação
  app.post('/admin/jogos/:id/resultado', {
    preHandler: [app.authenticate, apenasAdmin],
    schema: inserirResultadoBodySchema,
  }, inserirResultadoController as RouteHandlerMethod)

  // Atualiza status de um jogo
  app.patch('/admin/jogos/:id/status', {
    preHandler: [app.authenticate, apenasAdmin],
    schema: atualizarStatusBodySchema,
  }, atualizarStatusController as RouteHandlerMethod)

  // Lista jogos sem resultado
  app.get('/admin/jogos/pendentes', {
    preHandler: [app.authenticate, apenasAdmin],
  }, jogosPendentesController as RouteHandlerMethod)

  // Estatísticas gerais
  app.get('/admin/stats', {
    preHandler: [app.authenticate, apenasAdmin],
  }, estatisticasController as RouteHandlerMethod)

  // Assinantes de push notification
  app.get('/admin/push/assinantes', {
    preHandler: [app.authenticate, apenasAdmin],
  }, assinantesNotificacaoController as RouteHandlerMethod)
}