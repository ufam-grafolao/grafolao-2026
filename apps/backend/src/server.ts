import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import fastifyOAuth2, { OAuth2Namespace } from '@fastify/oauth2'
import rateLimit from '@fastify/rate-limit'

import { authRoutes } from './modules/auth/auth.routes.js'
import { jogosRoutes } from './modules/jogos/jogos.routes.js'
import { palpitesRoutes } from './modules/palpites/palpites.routes.js'
import { adminRoutes } from './modules/admin/admin.routes.js'
import { comunidadeRoutes } from './modules/comunidade/comunidade.routes.js'
import { rankingRoutes } from './modules/ranking/ranking.routes.js'
import { pushRoutes } from './modules/push/push.routes.js'
import { iniciarScheduler } from './scheduler.js'
import { palpitesEspeciaisRoutes } from './modules/palpites-especiais/palpites-especiais.routes.js'
import { jogadoresRoutes } from './modules/jogadores/jogadores.routes.js'
import { timesRoutes } from './modules/times/times.routes.js'
import { grafoConfrontosRoutes } from './modules/grafo-confrontos/grafo-confrontos.routes.js'
import { cliquesRoutes } from './modules/cliques/cliques.routes.js'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
  },
  bodyLimit: 1048576,
})


await app.register(fastifyCors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
})

await app.register(fastifyCookie)

await app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? 'grafolao_dev_secret',
})

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    error: 'Muitas requisições. Tente novamente em 1 minuto.',
  }),
})

await app.register(fastifyOAuth2, {
  name: 'googleOAuth2',
  scope: ['profile', 'email'],
  credentials: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID ?? '',
      secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    auth: {
      authorizeHost: 'https://accounts.google.com',
      authorizePath: '/o/oauth2/v2/auth',
      tokenHost: 'https://oauth2.googleapis.com',
      tokenPath: '/token',
    },
  },
  callbackUri: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3333/auth/google/callback',
})

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
await app.register(comunidadeRoutes)
await app.register(rankingRoutes)
await app.register(pushRoutes)
await app.register(palpitesEspeciaisRoutes)
await app.register(jogadoresRoutes)
await app.register(timesRoutes)
await app.register(grafoConfrontosRoutes)
await app.register(cliquesRoutes)

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})


const PORT = Number(process.env.PORT ?? 3333)
const HOST = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port: PORT, host: HOST })
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`)
  iniciarScheduler().catch(err => app.log.error(err, 'Falha ao iniciar scheduler'))
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

export type App = typeof app