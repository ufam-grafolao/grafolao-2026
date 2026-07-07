import { FastifyRequest, FastifyReply } from 'fastify'
import {
  buscarGrafoConfrontos,
  buscarCiclos,
  buscarCaminhoMaisLongo,
  buscarEvolucaoPorRodada,
} from './grafo-confrontos.service.js'

// ─── GET /grafos/confrontos?rodada=Matchday%201&minPalpites=10 ───────────────

export async function grafoConfrontosController(
  request: FastifyRequest<{ Querystring: { rodada?: string; minPalpites?: string } }>,
  reply: FastifyReply
) {
  const minPalpites = request.query.minPalpites ? Number(request.query.minPalpites) : 0
  const grafo = await buscarGrafoConfrontos(request.query.rodada, minPalpites)
  return reply.send(grafo)
}

// ─── GET /grafos/confrontos/ciclos?minPalpites=10 ─────────────────────────────

export async function ciclosController(
  request: FastifyRequest<{ Querystring: { rodada?: string; minPalpites?: string } }>,
  reply: FastifyReply
) {
  const minPalpites = request.query.minPalpites ? Number(request.query.minPalpites) : 0
  const ciclos = await buscarCiclos(request.query.rodada, minPalpites)
  return reply.send(ciclos)
}

// ─── GET /grafos/confrontos/caminho-mais-longo?orcamentoMs=120000&minPalpites=10 ──

export async function caminhoMaisLongoController(
  request: FastifyRequest<{
    Querystring: { rodada?: string; orcamentoMs?: string; minPalpites?: string }
  }>,
  reply: FastifyReply
) {
  const orcamentoMs = request.query.orcamentoMs
    ? Number(request.query.orcamentoMs)
    : undefined
  const minPalpites = request.query.minPalpites ? Number(request.query.minPalpites) : 0

  const caminho = await buscarCaminhoMaisLongo(request.query.rodada, orcamentoMs, minPalpites)
  return reply.send(caminho)
}

// ─── GET /grafos/confrontos/evolucao ──────────────────────────────────────────

export async function evolucaoController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const evolucao = await buscarEvolucaoPorRodada()
  return reply.send(evolucao)
}