import prisma from '../../db/prisma.js'
import { ordenarRodadasPorData } from '../../shared/utils/ordenar-rodadas.js'
import {
  cliquesMaximais,
  construirGrafoSimilaridade,
  resumirPanelas,
  type PalpiteAvaliado,
} from './panelinhas.algoritmos.js'
import type {
  ParametrosPanelinhas,
  PanelinhasResponse,
  PontoSeriePanelinhas,
} from './panelinhas.schema.js'

// Leitura do banco + chamada das funções puras de panelinhas.algoritmos.ts.
// Só jogos ENCERRADOS entram (palpites de jogos abertos ainda estão PENDENTE).

async function carregarBase(minPalpites: number) {
  const [jogos, usuarios] = await Promise.all([
    prisma.jogo.findMany({ select: { id: true, rodada: true, dataHora: true, status: true } }),
    prisma.usuario.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, nome: true, avatarUrl: true, _count: { select: { palpites: true } } },
    }),
  ])

  const encerrados = jogos.filter(j => j.status === 'ENCERRADO')
  const palpites = await prisma.palpite.findMany({
    where: { jogoId: { in: encerrados.map(j => j.id) } },
    select: { usuarioId: true, jogoId: true, status: true },
  })

  const participantes = usuarios.filter(u => u._count.palpites >= minPalpites)
  // A ordem das rodadas vem da data do primeiro jogo (ordenar-rodadas.ts), não do nome.
  const rodadas = ordenarRodadasPorData(encerrados)
  return { encerrados, palpites, participantes, rodadas }
}

/** Palpites dos jogos das rodadas até `rodada` (inclusive). Sem rodada: todos. */
function recortarAteRodada(
  base: Awaited<ReturnType<typeof carregarBase>>,
  rodada?: string
): { palpites: PalpiteAvaliado[]; jogos: number } {
  if (!rodada) return { palpites: base.palpites, jogos: base.encerrados.length }
  const indice = base.rodadas.indexOf(rodada)
  const acumuladas = new Set(indice < 0 ? [] : base.rodadas.slice(0, indice + 1))
  const jogos = new Set(base.encerrados.filter(j => acumuladas.has(j.rodada)).map(j => j.id))
  return { palpites: base.palpites.filter(p => jogos.has(p.jogoId)), jogos: jogos.size }
}

function calcular(ids: string[], palpites: PalpiteAvaliado[], params: ParametrosPanelinhas) {
  const grafo = construirGrafoSimilaridade(ids, palpites, params.percentil, {
    incluirBonus: params.incluirBonus,
    excluirAcimaDe: params.excluirAcimaDe,
  })
  const resultado = cliquesMaximais(grafo.vertices, grafo.arestas, params.orcamentoMs)
  const resumo = resumirPanelas(resultado.cliques, params.k)
  return { grafo, resultado, resumo }
}

export async function buscarPanelinhas(params: ParametrosPanelinhas): Promise<PanelinhasResponse> {
  const base = await carregarBase(params.minPalpites)
  const { palpites, jogos } = recortarAteRodada(base, params.rodada)
  const ids = base.participantes.map(u => u.id)
  const { grafo, resultado, resumo } = calcular(ids, palpites, params)

  const nomes = new Map(base.participantes.map(u => [u.id, u.nome]))
  const participante = (id: string) => ({ id, nome: nomes.get(id) ?? id })
  const panela = (membros: string[]) => ({ participantes: membros.map(participante), tamanho: membros.length })

  return {
    rodada: params.rodada ?? null,
    jogosConsiderados: jogos,
    percentil: params.percentil,
    limiar: Number.isFinite(grafo.limiar) ? grafo.limiar : null,
    nos: base.participantes.map(u => ({
      id: u.id,
      nome: u.nome,
      avatarUrl: u.avatarUrl,
      panelas: resumo.panelasPorParticipante.get(u.id) ?? 0,
    })),
    arestas: grafo.arestas.map(a => ({ origem: a.a, destino: a.b, peso: a.peso })),
    cliqueMaxima: panela(resumo.cliqueMaxima),
    totalPanelas: resumo.totalPanelas,
    maioresPanelas: resumo.maioresPanelas.map(panela),
    k: params.k,
    tamanhoMedioTopK: resumo.tamanhoMedioTopK,
    completou: resultado.completou,
    tempoMs: resultado.tempoMs,
  }
}

/**
 * Série ao longo do campeonato (pedido da orientadora: "panelas grandes e tamanho ao
 * longo do campeonato"): para cada rodada, o grafo acumulado até ela. O limiar é
 * recalculado a cada rodada, porque os pesos crescem com o número de jogos.
 */
export async function buscarSeriePanelinhas(
  params: Omit<ParametrosPanelinhas, 'rodada'>
): Promise<PontoSeriePanelinhas[]> {
  const base = await carregarBase(params.minPalpites)
  const ids = base.participantes.map(u => u.id)

  return base.rodadas.map(rodada => {
    const { palpites, jogos } = recortarAteRodada(base, rodada)
    const { grafo, resultado, resumo } = calcular(ids, palpites, params)
    return {
      rodada,
      jogosAcumulados: jogos,
      limiar: Number.isFinite(grafo.limiar) ? grafo.limiar : null,
      totalArestas: grafo.arestas.length,
      tamanhoMaximo: resumo.tamanhoMaximo,
      tamanhoMedioTopK: resumo.tamanhoMedioTopK,
      totalPanelas: resumo.totalPanelas,
      completou: resultado.completou,
      tempoMs: resultado.tempoMs,
    }
  })
}
