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

  const jogos = await prisma.jogo.findMany({
    where: {
      status: 'AGENDADO',
      dataHora: { gt: agora },
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

  let agendados = 0

  // O banco armazena dataHora como UTC+0, mas os valores representam horário de Manaus (UTC-4).
  // Somamos 4h para obter o instante UTC real do kickoff — mesmo ajuste feito em palpites.service.ts.
  const MANAUS_OFFSET_MS = 4 * 60 * 60 * 1000

  for (const jogo of jogos) {
    const nome = nomeJogo(jogo.timeCasa, jogo.timeVisitante, jogo.timeCasaRef, jogo.timeVisitanteRef)
    const kickoff = jogo.dataHora.getTime() + MANAUS_OFFSET_MS

    const ms60 = kickoff - 60 * 60 * 1000 - agora.getTime()
    const ms30 = kickoff - 30 * 60 * 1000 - agora.getTime()

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
  }

  console.log(`📅 Scheduler: ${agendados} notificações agendadas para ${jogos.length} jogos futuros`)
}
