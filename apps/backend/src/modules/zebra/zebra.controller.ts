import { FastifyReply, FastifyRequest } from 'fastify'
import { lerNumero } from '../../shared/utils/query.js'
import { METRICAS_OUSADIA, type MetricaOusadia, type OrdemZebra } from './zebra.algoritmos.js'
import {
  JogoNaoEncontradoError,
  buscarDetalheJogoZebra,
  buscarMstAgregada,
  buscarRankingZebra,
} from './zebra.service.js'

// Padrões (ver analise/resultados/zebra.md):
//   ousadia = media; ordenarPor = media (índice por jogo palpitado);
//   minPalpites = 10 no ranking e na MST agregada, porque com 1 ou 2 palpites a média
//   e a distância média entre pares são dominadas por um único jogo;
//   minJogosEmComum = 3 na MST agregada, pelo mesmo motivo.

const lerOusadia = (v?: string): MetricaOusadia =>
  (METRICAS_OUSADIA as string[]).includes(v ?? '') ? (v as MetricaOusadia) : 'media'
const lerOrdem = (v?: string): OrdemZebra => (v === 'soma' ? 'soma' : 'media')

// ─── GET /grafos/zebra/ranking?rodada=&minPalpites=10&ousadia=media&ordenarPor=media ──

export async function rankingZebraController(
  request: FastifyRequest<{ Querystring: { rodada?: string; minPalpites?: string; ousadia?: string; ordenarPor?: string } }>,
  reply: FastifyReply
) {
  const q = request.query
  return reply.send(await buscarRankingZebra({
    rodada: q.rodada || undefined,
    minPalpites: lerNumero(q.minPalpites, 10, { minimo: 0 }),
    ousadia: lerOusadia(q.ousadia),
    ordenarPor: lerOrdem(q.ordenarPor),
  }))
}

// ─── GET /grafos/zebra/mst?rodada=&minPalpites=10&minJogosEmComum=3 ───────────

export async function mstAgregadaController(
  request: FastifyRequest<{ Querystring: { rodada?: string; minPalpites?: string; minJogosEmComum?: string } }>,
  reply: FastifyReply
) {
  const q = request.query
  return reply.send(await buscarMstAgregada({
    rodada: q.rodada || undefined,
    minPalpites: lerNumero(q.minPalpites, 10, { minimo: 0 }),
    minJogosEmComum: Math.round(lerNumero(q.minJogosEmComum, 3, { minimo: 1 })),
  }))
}

// ─── GET /grafos/zebra/jogos/:jogoId?ousadia=media&limite=10 ──────────────────

export async function detalheJogoZebraController(
  request: FastifyRequest<{ Params: { jogoId: string }; Querystring: { ousadia?: string; limite?: string } }>,
  reply: FastifyReply
) {
  try {
    const detalhe = await buscarDetalheJogoZebra(
      request.params.jogoId,
      lerOusadia(request.query.ousadia),
      Math.round(lerNumero(request.query.limite, 10, { minimo: 1, maximo: 100 }))
    )
    return reply.send(detalhe)
  } catch (e) {
    if (e instanceof JogoNaoEncontradoError) return reply.status(404).send({ erro: e.message })
    throw e
  }
}
