import { FastifyRequest, FastifyReply } from 'fastify'
 
export async function autenticar(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Não autorizado' })
  }
}
 
export async function apenasAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
    const usuario = request.user as { role: string }
    if (usuario.role !== 'ADMIN') {
      reply.status(403).send({ error: 'Acesso restrito a administradores' })
    }
  } catch {
    reply.status(401).send({ error: 'Não autorizado' })
  }
}
 