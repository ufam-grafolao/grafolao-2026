import { FastifyRequest, FastifyReply } from 'fastify'
import { listarTimes } from './times.service.js'

export async function listarTimesController(_request: FastifyRequest, reply: FastifyReply) {
  const times = await listarTimes()
  return reply.send(times)
}
