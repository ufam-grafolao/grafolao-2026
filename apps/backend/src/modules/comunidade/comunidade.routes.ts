import { FastifyInstance, RouteHandlerMethod } from 'fastify'
import {
  listarComunidadesController,
  criarComunidadeController,
  entrarComunidadeController,
  expulsarMembroController,
  promoverMembroController,
  deletarComunidadeController,
  rankingComunidadeController,
  buscarComunidadesController,
  detalhesComunidadeController,
  solicitarEntradaController,
  listarSolicitacoesController,
  responderSolicitacaoController,
} from './comunidade.controller.js'
import {
  criarComunidadeResponseSchema,
  entrarComunidadeResponseSchema,
  rankingResponseSchema,
  comunidadesResponseSchema,
  criarComunidadeBodySchema,
  promoverMembroBodySchema,
} from './comunidade.schema.js'
import type { CriarComunidadeBody, EntrarComunidadeBody, PromoverMembroBody } from './comunidade.schema.js'

export async function comunidadeRoutes(app: FastifyInstance) {
  app.get('/comunidades', {
    preHandler: [app.authenticate],
    schema: { response: comunidadesResponseSchema },
  }, listarComunidadesController)

  app.post<{ Body: CriarComunidadeBody }>('/comunidades', {
    preHandler: [app.authenticate],
    schema: {
      ...criarComunidadeBodySchema,
      response: criarComunidadeResponseSchema,
    },
  }, criarComunidadeController)

  app.post<{ Params: { comunidadeId: string }; Body: EntrarComunidadeBody }>(
    '/comunidades/:comunidadeId/entrar', {
      preHandler: [app.authenticate],
      schema: { response: entrarComunidadeResponseSchema },
    }, entrarComunidadeController)

  app.delete<{ Params: { comunidadeId: string; membroId: string } }>(
    '/comunidades/:comunidadeId/membros/:membroId', {
      preHandler: [app.authenticate],
    }, expulsarMembroController)

  app.patch<{ Params: { comunidadeId: string }; Body: PromoverMembroBody }>(
    '/comunidades/:comunidadeId/membros/promover', {
      preHandler: [app.authenticate],
      schema: promoverMembroBodySchema,
    }, promoverMembroController)

  app.delete<{ Params: { comunidadeId: string } }>(
    '/comunidades/:comunidadeId', {
      preHandler: [app.authenticate],
    }, deletarComunidadeController)

  app.get<{ Params: { comunidadeId: string } }>(
    '/comunidades/:comunidadeId/ranking', {
      preHandler: [app.authenticate],
      schema: { response: rankingResponseSchema },
    }, rankingComunidadeController)

  app.get('/comunidades/buscar', {
    preHandler: [app.authenticate],
  }, buscarComunidadesController as RouteHandlerMethod)

  app.get('/comunidades/:comunidadeId', {
    preHandler: [app.authenticate],
  }, detalhesComunidadeController as RouteHandlerMethod)

  app.post('/comunidades/:comunidadeId/solicitar', {
    preHandler: [app.authenticate],
  }, solicitarEntradaController as RouteHandlerMethod)

  app.get('/comunidades/:comunidadeId/solicitacoes', {
    preHandler: [app.authenticate],
  }, listarSolicitacoesController as RouteHandlerMethod)

  app.patch('/comunidades/:comunidadeId/solicitacoes/:solicitacaoId', {
    preHandler: [app.authenticate],
  }, responderSolicitacaoController as RouteHandlerMethod)
}