import { FastifyReply, FastifyRequest } from 'fastify'
import { lerBooleano, lerNumero, lerNumeroOpcional } from '../../shared/utils/query.js'
import { ORCAMENTO_PADRAO_MS, PERCENTIL_PADRAO } from './panelinhas.algoritmos.js'
import type { ParametrosPanelinhas } from './panelinhas.schema.js'
import { buscarPanelinhas, buscarSeriePanelinhas } from './panelinhas.service.js'

type Query = {
  rodada?: string
  minPalpites?: string
  percentil?: string
  excluirAcimaDe?: string
  incluirBonus?: string
  k?: string
  orcamentoMs?: string
}

function lerParametros(q: Query): ParametrosPanelinhas {
  return {
    rodada: q.rodada || undefined,
    // Padrão 10: sem o recorte, o percentil é puxado por quem palpitou poucos jogos
    // (ver analise/resultados/panelinhas.md). ?minPalpites=0 inclui todos.
    minPalpites: lerNumero(q.minPalpites, 10, { minimo: 0 }),
    percentil: lerNumero(q.percentil, PERCENTIL_PADRAO, { minimo: 0, maximo: 100 }),
    excluirAcimaDe: lerNumeroOpcional(q.excluirAcimaDe, { minimo: 0, maximo: 1 }),
    incluirBonus: lerBooleano(q.incluirBonus, true),
    k: Math.round(lerNumero(q.k, 5, { minimo: 1, maximo: 50 })),
    orcamentoMs: lerNumero(q.orcamentoMs, ORCAMENTO_PADRAO_MS, { minimo: 1, maximo: 120_000 }),
  }
}

// ─── GET /grafos/panelinhas?rodada=Matchday%2010&percentil=90 (minPalpites padrão 10) ───

export async function panelinhasController(
  request: FastifyRequest<{ Querystring: Query }>,
  reply: FastifyReply
) {
  return reply.send(await buscarPanelinhas(lerParametros(request.query)))
}

// ─── GET /grafos/panelinhas/serie?minPalpites=10&percentil=90&k=5 ─────────────

export async function seriePanelinhasController(
  request: FastifyRequest<{ Querystring: Query }>,
  reply: FastifyReply
) {
  const { rodada: _ignorada, ...params } = lerParametros(request.query)
  return reply.send(await buscarSeriePanelinhas(params))
}
