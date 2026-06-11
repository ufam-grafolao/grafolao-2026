import { FastifyInstance } from 'fastify'
import {
  googleLoginController,
  googleCallbackController,
  meController,
  logoutController,
} from './auth.controller.js'
import { meResponseSchema, logoutResponseSchema } from './auth.schema.js'

export async function authRoutes(app: FastifyInstance) {
  // Inicia fluxo OAuth2 com o Google
  app.get('/auth/google', (request, reply) =>
    googleLoginController(app, request, reply)
  )

  // Callback do Google após autenticação
  app.get('/auth/google/callback', (request, reply) =>
    googleCallbackController(app, request, reply)
  )

  // Retorna dados do usuário autenticado
  app.get('/auth/me', {
    preHandler: [app.authenticate],
    schema: { response: meResponseSchema },
  }, meController)

  // Logout
  app.post('/auth/logout', {
    preHandler: [app.authenticate],
    schema: { response: logoutResponseSchema },
  }, logoutController)
}