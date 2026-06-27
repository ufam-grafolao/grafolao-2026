import { FastifyRequest, FastifyReply } from 'fastify'
import {
  buscarConfig,
  buscarMeusPalpitesEspeciais,
  buscarResultadosEspeciais,
  salvarPalpiteEspecial,
  inserirResultadoEspecial,
  PrazoEncerradoError,
  LimiteEdicoesError,
  ValorInvalidoError,
} from './palpites-especiais.service.js'
import type { SalvarPalpiteEspecialBody, InserirResultadoEspecialBody } from './palpites-especiais.schema.js'

export async function configPalpitesEspeciaisController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(buscarConfig())
}

export async function meusPalpitesEspeciaisController(request: FastifyRequest, reply: FastifyReply) {
  const usuarioId = request.user.id
  const palpites = await buscarMeusPalpitesEspeciais(usuarioId)
  return reply.send(palpites)
}

export async function resultadosEspeciaisController(_request: FastifyRequest, reply: FastifyReply) {
  const resultados = await buscarResultadosEspeciais()
  return reply.send(resultados)
}

export async function salvarPalpiteEspecialController(
  request: FastifyRequest<{ Body: SalvarPalpiteEspecialBody }>,
  reply: FastifyReply
) {
  const usuarioId = request.user.id
  try {
    const salvo = await salvarPalpiteEspecial(usuarioId, request.body)
    return reply.send(salvo)
  } catch (err) {
    if (err instanceof PrazoEncerradoError) return reply.code(403).send({ error: err.message })
    if (err instanceof LimiteEdicoesError) return reply.code(403).send({ error: err.message })
    if (err instanceof ValorInvalidoError) return reply.code(400).send({ error: err.message })
    throw err
  }
}

export async function inserirResultadoEspecialController(
  request: FastifyRequest<{ Body: InserirResultadoEspecialBody }>,
  reply: FastifyReply
) {
  if (request.user.role !== 'ADMIN') {
    return reply.code(403).send({ error: 'Acesso restrito a administradores.' })
  }
  try {
    const resultado = await inserirResultadoEspecial(request.user.id, request.body)
    return reply.send(resultado)
  } catch (err) {
    if (err instanceof ValorInvalidoError) return reply.code(400).send({ error: err.message })
    throw err
  }
}