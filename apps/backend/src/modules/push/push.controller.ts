import { FastifyRequest, FastifyReply } from 'fastify'
import {
  salvarSubscription,
  removerSubscription,
  buscarSubscriptionDoUsuario,
  enviarParaTodos,
} from './push.service.js'
import type { JwtPayload as AuthJwtPayload } from '../auth/auth.schema.js'

// POST /push/subscribe
export async function subscribeController(
  request: FastifyRequest<{ Body: { endpoint: string; keys: { p256dh: string; auth: string } } }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const { endpoint, keys } = request.body
    await salvarSubscription(usuarioId, endpoint, keys.p256dh, keys.auth)
    return reply.status(201).send({ ok: true })
  } catch {
    return reply.status(500).send({ error: 'ERRO_INTERNO' })
  }
}

// DELETE /push/unsubscribe
export async function unsubscribeController(
  request: FastifyRequest<{ Body: { endpoint: string } }>,
  reply: FastifyReply
) {
  try {
    await removerSubscription(request.body.endpoint)
    return reply.status(204).send()
  } catch {
    return reply.status(500).send({ error: 'ERRO_INTERNO' })
  }
}

// GET /push/status
export async function statusController(
  request: FastifyRequest<{ Querystring: { endpoint: string } }>,
  reply: FastifyReply
) {
  try {
    const { id: usuarioId } = request.user as AuthJwtPayload
    const sub = await buscarSubscriptionDoUsuario(usuarioId, request.query.endpoint)
    return reply.send({ inscrito: !!sub })
  } catch {
    return reply.status(500).send({ error: 'ERRO_INTERNO' })
  }
}

// GET /push/vapid-public-key
export async function vapidKeyController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ key: process.env.VAPID_PUBLIC_KEY ?? '' })
}

// POST /push/teste (admin)
export async function testeController(_request: FastifyRequest, reply: FastifyReply) {
  try {
    await enviarParaTodos({
      title: '🔔 Teste de notificação — Grafolão',
      body:  'Se você está vendo isso, as notificações estão funcionando!',
      url:   '/dashboard',
    })
    return reply.send({ ok: true })
  } catch {
    return reply.status(500).send({ error: 'ERRO_INTERNO' })
  }
}
