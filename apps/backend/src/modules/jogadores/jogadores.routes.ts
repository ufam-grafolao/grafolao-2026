import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import { buscarJogadoresController } from './jogadores.controller.js'

export async function jogadoresRoutes(app: FastifyInstance) {
  app.get('/jogadores/buscar', {
    preHandler: [app.authenticate],
  }, buscarJogadoresController as RouteHandlerMethod)
}