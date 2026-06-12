import { FastifyRequest, FastifyReply } from 'fastify'
import { buscarJogos, buscarJogosHoje, buscarJogoPorId, buscarJogoPorTime } from './jogos.service.js'
import type { JogosQueryParams } from './jogos.schema.js'

//  GET /jogos 

export async function listarJogosController(
  request: FastifyRequest<{ Querystring: JogosQueryParams }>,
  reply: FastifyReply
) {
  const jogos = await buscarJogos(request.query)
  return reply.send(jogos)
}

//  GET /jogos/hoje 

export async function jogosHojeController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const agora = new Date()
  const agoraManaus = new Date(agora.getTime() - 4 * 60 * 60 * 1000)
  const dataManaus = agoraManaus.toISOString().split('T')[0]

  const jogos = await buscarJogosHoje(dataManaus)
  return reply.send(jogos)
}

//  GET /jogos/:id 

export async function detalheJogoController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const jogo = await buscarJogoPorId(request.params.id)

  if (!jogo) {
    return reply.status(404).send({ error: 'Jogo não encontrado' })
  }

  return reply.send(jogo)
}

// GET /jogos/:timeId

export async function jogosPorTimeController(
  request: FastifyRequest<{ Params: { timeId: string } }>,
  reply: FastifyReply
) {
  const jogos = await buscarJogoPorTime(request.params.timeId)

  if (!jogos || jogos.length === 0) {
    return reply.status(404).send({ error: 'Nenhum jogo encontrado para este time' })
  }

  return reply.send(jogos)
}