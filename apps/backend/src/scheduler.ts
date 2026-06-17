import prisma from './db/prisma.js'
import { enviarParaTodos } from './modules/push/push.service.js'
import { getNomePt } from './shared/utils/nomes-times.js'

function nomeJogo(
  timeCasa: { nome: string } | null,
  timeVisitante: { nome: string } | null,
  casaRef: string | null,
  visitanteRef: string | null
) {
  const casa      = getNomePt(timeCasa?.nome      ?? casaRef      ?? '?')
  const visitante = getNomePt(timeVisitante?.nome ?? visitanteRef ?? '?')
  return `${casa} x ${visitante}`
}

function agendarTimeout(ms: number, fn: () => void) {
  // setTimeout tem limite de ~24.8 dias em ms (2^31 - 1)
  // Para jogos muito distantes, aguarda em partes
  const MAX = 2 ** 31 - 1
  if (ms <= 0) return
  if (ms > MAX) {
    setTimeout(() => agendarTimeout(ms - MAX, fn), MAX)
  } else {
    setTimeout(fn, ms)
  }
}

export async function iniciarScheduler() {
  const agora = new Date()
  const manaus_offset = 4 * 60 * 60 * 1000

  // Busca jogos cujo kickoff real (stored + 4h) ainda não passou
  const agoraAjustada = new Date(agora.getTime() - manaus_offset)

  const jogos = await prisma.jogo.findMany({
    where: {
      status: 'AGENDADO',
      dataHora: { gt: agoraAjustada },
    },
    select: {
      id: true,
      dataHora: true,
      timeCasaRef: true,
      timeVisitanteRef: true,
      timeCasa:      { select: { nome: true } },
      timeVisitante: { select: { nome: true } },
    },
  })

  // Debug: próximos 4 jogos com horários de kickoff e notificações
  const proximos4 = [...jogos]
    .sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime())
    .slice(0, 4)
  for (const j of proximos4) {
    const n    = nomeJogo(j.timeCasa, j.timeVisitante, j.timeCasaRef, j.timeVisitanteRef)
    const kick = new Date(j.dataHora.getTime() + manaus_offset)
    const n60  = new Date(kick.getTime() - 60 * 60 * 1000)
    const n30  = new Date(kick.getTime() - 30 * 60 * 1000)
    const n15  = new Date(kick.getTime() - 15 * 60 * 1000)
    console.log(
      `🔍 ${n}\n` +
      `   DB stored : ${j.dataHora.toISOString()}\n` +
      `   kickoff   : ${kick.toISOString()}\n` +
      `   notif -1h : ${n60.toISOString()}\n` +
      `   notif -30m: ${n30.toISOString()}\n` +
      `   notif -15m: ${n15.toISOString()}`
    )
  }

  let agendados = 0

  for (const jogo of jogos) {
    const nome = nomeJogo(jogo.timeCasa, jogo.timeVisitante, jogo.timeCasaRef, jogo.timeVisitanteRef)
    const kickoff = jogo.dataHora.getTime() + manaus_offset

    const ms60 = kickoff - 60 * 60 * 1000 - agora.getTime()
    const ms30 = kickoff - 30 * 60 * 1000 - agora.getTime()
    const ms15 = kickoff - 15 * 60 * 1000 - agora.getTime()

    if (ms60 > 0) {
      agendarTimeout(ms60, () =>
        enviarParaTodos({
          title: `⚽ ${nome} em 1 hora!`,
          body:  'Não esqueça de fazer seu palpite antes de fechar.',
          url:   '/jogos',
        }).catch(() => {})
      )
      agendados++
    }

    if (ms30 > 0) {
      agendarTimeout(ms30, () =>
        enviarParaTodos({
          title: `⏰ Últimos 30 minutos! ${nome}`,
          body:  'Corra para palpitar antes de fechar!',
          url:   '/jogos',
        }).catch(() => {})
      )
      agendados++
    }

    if (ms15 > 0) {
      agendarTimeout(ms15, () =>
        enviarParaTodos({
          title: `🚨 ${nome} começa em 15 minutos!`,
          body:  'Último aviso — feche seu palpite agora!',
          url:   '/jogos',
        }).catch(() => {})
      )
      agendados++
    }
  }

  console.log(`📅 Scheduler: ${agendados} notificações agendadas para ${jogos.length} jogos futuros`)
}
