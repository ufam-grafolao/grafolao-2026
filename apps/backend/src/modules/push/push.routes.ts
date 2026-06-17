import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { apenasAdmin } from '../../shared/middlewares/auth.middleware.js'
import {
  subscribeController,
  unsubscribeController,
  statusController,
  vapidKeyController,
  testeController,
} from './push.controller.js'

export async function pushRoutes(app: FastifyInstance) {
  app.get('/push/vapid-public-key', vapidKeyController)

  app.post<{ Body: { endpoint: string; keys: { p256dh: string; auth: string } } }>(
    '/push/subscribe', { preHandler: [app.authenticate] }, subscribeController
  )

  app.delete<{ Body: { endpoint: string } }>(
    '/push/unsubscribe', { preHandler: [app.authenticate] }, unsubscribeController
  )

  app.get<{ Querystring: { endpoint: string } }>(
    '/push/status', { preHandler: [app.authenticate] }, statusController
  )

  app.post(
    '/push/teste',
    { preHandler: [app.authenticate, apenasAdmin] },
    testeController as RouteHandlerMethod
  )
}
