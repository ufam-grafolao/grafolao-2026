import { FastifyRequest, FastifyReply } from 'fastify'
import prisma from '../../db/prisma.js'

export async function buscarJogadoresController(
  request: FastifyRequest<{ Querystring: { q?: string } }>,
  reply: FastifyReply
) {
  const termo = request.query.q?.trim() ?? ''
  if (termo.length < 2) return reply.send([])

  const jogadores = await prisma.jogador.findMany({
    where: { name: { contains: termo, mode: 'insensitive' } },
    include: { time: { select: { nome: true, codigo: true } } },
    take: 20,
  })

  return reply.send(
    jogadores.map(j => ({
      id: j.id,
      name: j.name,
      timeNome: j.time.nome,
      timeCodigo: j.time.codigo,
      fotoUrl: j.fotoUrl,
    }))
  )
}