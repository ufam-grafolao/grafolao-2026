import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  buscarPerfilGoogle,
  upsertUsuario,
  montarPayloadJwt,
  buscarUsuarioPorId,
  buscarResumoUsuario,
} from './auth.service.js'
import type { JwtPayload } from './auth.schema.js'

// ─── GET /auth/google

export async function googleLoginController(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authUrl = await (app as any).googleOAuth2.generateAuthorizationUri(request, reply)
  return reply.redirect(authUrl)
}

// ─── GET /auth/google/callback 

export async function googleCallbackController(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { token } = await (app as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)

    const profile = await buscarPerfilGoogle(token.access_token)
    const usuario = await upsertUsuario(profile)

    if (!usuario.ativo) {
      return reply.redirect(`${process.env.FRONTEND_URL}/login?erro=conta_desativada`)
    }

    const payload = montarPayloadJwt(usuario)
    const jwt = app.jwt.sign(payload, { expiresIn: '7d' })

    return reply.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwt}`)
  } catch (error) {
    console.error('Erro no callback do Google:', error)
    return reply.redirect(`${process.env.FRONTEND_URL}/login?erro=falha_autenticacao`)
  }
}

// ─── GET /auth/me 

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.user as JwtPayload

  const usuario = await buscarUsuarioPorId(id)

  if (!usuario) {
    return reply.status(404).send({ error: 'Usuário não encontrado' })
  }

  return reply.send(usuario)
}

// ─── POST /auth/logout 

export async function logoutController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ message: 'Logout realizado. Remova o token do cliente.' })
}

export async function resumoController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.user as JwtPayload
  const resumo = await buscarResumoUsuario(id)
  return reply.send(resumo)
}