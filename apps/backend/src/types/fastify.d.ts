import '@fastify/jwt'
import { FastifyRequest, FastifyReply } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyJWT {
    payload: {
      id: string
      nome: string
      email: string
      avatarUrl: string | null
      role: string
    }
    user: {
      id: string
      nome: string
      email: string
      avatarUrl: string | null
      role: string
    }
  }
}