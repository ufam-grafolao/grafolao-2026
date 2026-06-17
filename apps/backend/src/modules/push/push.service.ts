import webpush from 'web-push'
import prisma from '../../db/prisma.js'

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_EMAIL   = process.env.VAPID_EMAIL?.includes('@')
  ? process.env.VAPID_EMAIL
  : 'mailto:admin@grafolao.com'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
  console.log('🔔 Push: VAPID configurado')
} else {
  console.warn('⚠️  Push: VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY não definidos — notificações desativadas')
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function salvarSubscription(
  usuarioId: string,
  endpoint: string,
  p256dh: string,
  auth: string
) {
  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { usuarioId, p256dh, auth },
    create: { usuarioId, endpoint, p256dh, auth },
  })
  console.log(`🔔 Push: subscription salva para usuário ${usuarioId}`)
  return sub
}

export async function removerSubscription(endpoint: string) {
  return prisma.pushSubscription.deleteMany({ where: { endpoint } })
}

export async function buscarSubscriptionDoUsuario(usuarioId: string, endpoint: string) {
  return prisma.pushSubscription.findFirst({ where: { usuarioId, endpoint } })
}

export async function enviarParaTodos(payload: PushPayload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('⚠️  Push: tentativa de envio sem VAPID configurado — ignorado')
    return
  }

  const subs = await prisma.pushSubscription.findMany()
  console.log(`🔔 Push: enviando "${payload.title}" para ${subs.length} subscription(s)`)

  if (subs.length === 0) return

  const resultados = await Promise.allSettled(
    subs.map(sub =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
        .catch(async err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`🔔 Push: subscription expirada removida (${sub.endpoint.slice(0, 40)}...)`)
            await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } })
          } else {
            console.error(`🔔 Push: erro ao enviar — status ${err.statusCode}:`, err.body)
          }
        })
    )
  )

  const enviados = resultados.filter(r => r.status === 'fulfilled').length
  console.log(`🔔 Push: ${enviados}/${subs.length} enviados com sucesso`)
}
