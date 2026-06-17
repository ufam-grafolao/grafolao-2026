import { FastifyRequest, FastifyReply } from 'fastify'
import {
  criarComunidade,
  listarComunidades,
  entrarComunidade,
  expulsarMembro,
  promoverMembro,
  deletarComunidade,
  rankingComunidade,
  buscarComunidades,
  detalhesComunidade,
  solicitarEntrada,
  listarSolicitacoes,
  responderSolicitacao,
  alterarTipoComunidade,
  sairComunidade,
  atualizarComunidade,
  palpitesComunidade,
} from './comunidades.service.js'
import type {
  AlterarTipoComunidadeBody,
  AtualizarComunidadeBody,
  CriarComunidadeBody,
  EntrarComunidadeBody,
  PromoverMembroBody,
} from './comunidade.schema.js'
import type { JwtPayload as AuthJwtPayload } from '../auth/auth.schema.js'

const errosHTTP: Record<string, number> = {
  LIMITE_ATINGIDO: 403,
  JA_MEMBRO:       409,
  CODIGO_INVALIDO: 401,
  SEM_PERMISSAO:   403,
}

function handleError(error: unknown, reply: FastifyReply) {
  const msg = error instanceof Error ? error.message : 'ERRO_INTERNO'
  const status = errosHTTP[msg] ?? 500
  return reply.status(status).send({ error: msg })
}

// GET /comunidades

export async function listarComunidadesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id: usuarioId } = request.user as AuthJwtPayload
  const comunidades = await listarComunidades(usuarioId)
  return reply.send(comunidades)
}

// POST /comunidades

export async function criarComunidadeController(
  request: FastifyRequest<{ Body: CriarComunidadeBody }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const comunidade = await criarComunidade(usuarioId, request.body)
    return reply.status(201).send(comunidade)
  } catch (e) {
    return handleError(e, reply)
  }
}

// POST /comunidades/:comunidadeId/entrar

export async function entrarComunidadeController(
  request: FastifyRequest<{ Params: { comunidadeId: string }; Body: EntrarComunidadeBody }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const membro = await entrarComunidade(usuarioId, request.params.comunidadeId, request.body)
    return reply.status(201).send(membro)
  } catch (e) {
    return handleError(e, reply)
  }
}

// DELETE /comunidades/:comunidadeId/membros/:membroId

export async function expulsarMembroController(
  request: FastifyRequest<{ Params: { comunidadeId: string; membroId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    await expulsarMembro(usuarioId, request.params.comunidadeId, request.params.membroId)
    return reply.status(204).send()
  } catch (e) {
    return handleError(e, reply)
  }
}

// PATCH /comunidades/:comunidadeId/membros/promover

export async function promoverMembroController(
  request: FastifyRequest<{ Params: { comunidadeId: string }; Body: PromoverMembroBody }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const membro = await promoverMembro(usuarioId, request.params.comunidadeId, request.body)
    return reply.send(membro)
  } catch (e) {
    return handleError(e, reply)
  }
}

// DELETE /comunidades/:comunidadeId

export async function deletarComunidadeController(
  request: FastifyRequest<{ Params: { comunidadeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    await deletarComunidade(usuarioId, request.params.comunidadeId)
    return reply.status(204).send()
  } catch (e) {
    return handleError(e, reply)
  }
}

// GET /comunidades/:comunidadeId/ranking

export async function rankingComunidadeController(
  request: FastifyRequest<{ Params: { comunidadeId: string } }>,
  reply: FastifyReply
) {
  try {
    const ranking = await rankingComunidade(request.params.comunidadeId)
    return reply.send(ranking)
  } catch (e) {
    return handleError(e, reply)
  }
}

export async function buscarComunidadesController(
  request: FastifyRequest<{ Querystring: { q: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const comunidades = await buscarComunidades(request.query.q ?? '', usuarioId)
    return reply.send(comunidades)
  } catch (e) {
    return handleError(e, reply)
  }
}

export async function detalhesComunidadeController(
  request: FastifyRequest<{ Params: { comunidadeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const comunidade = await detalhesComunidade(request.params.comunidadeId, usuarioId)
    return reply.send(comunidade)
  } catch (e) {
    return handleError(e, reply)
  }
}

export async function solicitarEntradaController(
  request: FastifyRequest<{ Params: { comunidadeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const solicitacao = await solicitarEntrada(usuarioId, request.params.comunidadeId)
    return reply.status(201).send(solicitacao)
  } catch (e) {
    return handleError(e, reply)
  }
}

export async function listarSolicitacoesController(
  request: FastifyRequest<{ Params: { comunidadeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const solicitacoes = await listarSolicitacoes(usuarioId, request.params.comunidadeId)
    return reply.send(solicitacoes)
  } catch (e) {
    return handleError(e, reply)
  }
}

export async function responderSolicitacaoController(
  request: FastifyRequest<{
    Params: { comunidadeId: string; solicitacaoId: string }
    Body: { aceitar: boolean }
  }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const resultado = await responderSolicitacao(
      usuarioId,
      request.params.comunidadeId,
      request.params.solicitacaoId,
      request.body.aceitar
    )
    return reply.send(resultado)
  } catch (e) {
    return handleError(e, reply)
  }
}

export async function alterarTipoComunidadeController(
  request: FastifyRequest<{ Params: { comunidadeId: string }; Body: AlterarTipoComunidadeBody }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const comunidade = await alterarTipoComunidade(usuarioId, request.params.comunidadeId, request.body.tipo)
    return reply.send(comunidade)
  } catch (e) {
    return handleError(e, reply)
  }
}

export async function palpitesComunidadeController(
  request: FastifyRequest<{ Params: { comunidadeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const resultado = await palpitesComunidade(request.params.comunidadeId, usuarioId)
    return reply.send(resultado)
  } catch (e) {
    return handleError(e, reply)
  }
}

export async function atualizarComunidadeController(
  request: FastifyRequest<{ Params: { comunidadeId: string }; Body: AtualizarComunidadeBody }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const comunidade = await atualizarComunidade(usuarioId, request.params.comunidadeId, request.body)
    return reply.send(comunidade)
  } catch (e) {
    return handleError(e, reply)
  }
}

export async function sairComunidadeController(
  request: FastifyRequest<{ Params: { comunidadeId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    await sairComunidade(usuarioId, request.params.comunidadeId)
    return reply.status(204).send()
  } catch (e) {
    return handleError(e, reply)
  }
}