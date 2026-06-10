import { FastifyInstance } from 'fastify'
import prisma from '../../db/prisma.js'

interface GoogleProfile {
  sub: string
  name: string
  email: string
  picture: string
}

export async function authRoutes(app: FastifyInstance) {
  // Redireciona para o Google
  app.get('/auth/google', async (request, reply) => {
    const authUrl = await (app as any).googleOAuth2.generateAuthorizationUri(request, reply)
    return reply.redirect(authUrl)
  })

  // Callback do Google após autenticação
  app.get('/auth/google/callback', async (request, reply) => {
    try {
      const { token } = await (app as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)

      // Busca perfil do usuário no Google
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      })
      const profile = (await profileResponse.json()) as GoogleProfile

      // Verifica se é o primeiro usuário (vira admin)
      const totalUsuarios = await prisma.usuario.count()
      const primeiroUsuario = totalUsuarios === 0

      // Cria ou atualiza o usuário
      const usuario = await prisma.usuario.upsert({
        where: { googleId: profile.sub },
        update: {
          nome: profile.name,
          avatarUrl: profile.picture,
        },
        create: {
          googleId: profile.sub,
          email: profile.email,
          nome: profile.name,
          avatarUrl: profile.picture,
          role: primeiroUsuario ? 'ADMIN' : 'PARTICIPANTE',
        },
      })

      if (!usuario.ativo) {
        return reply.redirect(`${process.env.FRONTEND_URL}/login?erro=conta_desativada`)
      }

      // Gera JWT próprio
      const jwt = app.jwt.sign(
        {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          avatarUrl: usuario.avatarUrl,
          role: usuario.role,
        },
        { expiresIn: '7d' }
      )

      // Redireciona pro frontend com o token
      return reply.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwt}`)
    } catch (error) {
      console.error('Erro no callback do Google:', error)
      return reply.redirect(`${process.env.FRONTEND_URL}/login?erro=falha_autenticacao`)
    }
  })

  // Retorna dados do usuário autenticado
  app.get(
    '/auth/me',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const payload = request.user as { id: string }
      const usuario = await prisma.usuario.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          nome: true,
          email: true,
          avatarUrl: true,
          role: true,
          criadoEm: true,
        },
      })

      if (!usuario) {
        return reply.status(404).send({ error: 'Usuário não encontrado' })
      }

      return reply.send(usuario)
    }
  )

  // Logout (só informativo — JWT é stateless)
  app.post('/auth/logout', async (_request, reply) => {
    return reply.send({ message: 'Logout realizado. Remova o token do cliente.' })
  })
}