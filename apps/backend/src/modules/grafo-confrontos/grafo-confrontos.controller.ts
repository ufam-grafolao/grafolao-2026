import { FastifyRequest, FastifyReply } from 'fastify'
import {
  buscarGrafoConfrontos,
  buscarCiclos,
  buscarCaminhoMaisLongo,
  buscarEvolucaoPorRodada,
} from './grafo-confrontos.service.js'
import { lerBooleano } from '../../shared/utils/query.js'

// considerarAusencia (padrão true): aplica a regra da ausência. Use
// ?considerarAusencia=false para comparar com o grafo sem a regra.

// ─── GET /grafos/confrontos?rodada=Matchday%201&minPalpites=10 ───────────────

export async function grafoConfrontosController(
  request: FastifyRequest<{ Querystring: { rodada?: string; minPalpites?: string; considerarAusencia?: string } }>,
  reply: FastifyReply
) {
  const minPalpites = request.query.minPalpites ? Number(request.query.minPalpites) : 0
  const considerarAusencia = lerBooleano(request.query.considerarAusencia, true)
  const grafo = await buscarGrafoConfrontos(request.query.rodada, minPalpites, considerarAusencia)
  return reply.send(grafo)
}

// ─── GET /grafos/confrontos/ciclos?minPalpites=10 ─────────────────────────────

export async function ciclosController(
  request: FastifyRequest<{ Querystring: { rodada?: string; minPalpites?: string; considerarAusencia?: string } }>,
  reply: FastifyReply
) {
  const minPalpites = request.query.minPalpites ? Number(request.query.minPalpites) : 0
  const considerarAusencia = lerBooleano(request.query.considerarAusencia, true)
  const ciclos = await buscarCiclos(request.query.rodada, minPalpites, considerarAusencia)
  return reply.send(ciclos)
}

// ─── GET /grafos/confrontos/caminho-mais-longo?orcamentoMs=120000&minPalpites=10 ──

export async function caminhoMaisLongoController(
  request: FastifyRequest<{
    Querystring: { rodada?: string; orcamentoMs?: string; minPalpites?: string; considerarAusencia?: string }
  }>,
  reply: FastifyReply
) {
  const orcamentoMs = request.query.orcamentoMs
    ? Number(request.query.orcamentoMs)
    : undefined
  const minPalpites = request.query.minPalpites ? Number(request.query.minPalpites) : 0

  const considerarAusencia = lerBooleano(request.query.considerarAusencia, true)
  const caminho = await buscarCaminhoMaisLongo(
    request.query.rodada, orcamentoMs, minPalpites, considerarAusencia
  )
  return reply.send(caminho)
}

// ─── GET /grafos/confrontos/evolucao ──────────────────────────────────────────

export async function evolucaoController(
  request: FastifyRequest<{ Querystring: { considerarAusencia?: string } }>,
  reply: FastifyReply
) {
  const evolucao = await buscarEvolucaoPorRodada(lerBooleano(request.query.considerarAusencia, true))
  return reply.send(evolucao)
}