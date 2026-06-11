import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import fastifyOAuth2 from '@fastify/oauth2'

import { authRoutes } from './modules/auth/auth.routes.js'
import { jogosRoutes } from './modules/jogos/jogos.routes.js'
import { palpitesRoutes } from './modules/palpites/palpites.routes.js'
import { adminRoutes } from './modules/admin/admin.routes.js'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
  },
})

// ─── Plugins ────────────────────────────────────────

await app.register(fastifyCors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(fastifyCookie)

await app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? 'grafolao_dev_secret',
})

await app.register(fastifyOAuth2, {
  name: 'googleOAuth2',
  scope: ['profile', 'email'],
  credentials: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID ?? '',
      secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    auth: fastifyOAuth2.GOOGLE_CONFIGURATION,
  },
  callbackUri: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3333/auth/google/callback',
})

// Decorator para autenticação nas rotas
app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Não autorizado' })
  }
})

// ─── Rotas ──────────────────────────────────────────

await app.register(authRoutes)
await app.register(jogosRoutes)
await app.register(palpitesRoutes)
await app.register(adminRoutes)

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// ─── Start ──────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3333)
const HOST = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port: PORT, host: HOST })
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

export type App = typeof app