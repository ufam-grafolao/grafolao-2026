import prisma from '../../db/prisma.js'
import { distanciaMediaAgregada } from '../../shared/similaridade/similaridade-palpites.js'
import {
  indiceDeZebra,
  mstDoJogo,
  mstKruskal,
  ousadiaNoJogo,
  ousadosQueAcertaram,
  type MetricaOusadia,
  type OrdemZebra,
  type PalpiteJogo,
} from './zebra.algoritmos.js'
import type {
  DetalheJogoZebraResponse,
  MstAgregadaResponse,
  RankingZebraResponse,
} from './zebra.schema.js'

// Leitura do banco + funções puras de zebra.algoritmos.ts.
// Só jogos ENCERRADOS: num jogo aberto, mostrar a MST ou a ousadia revelaria os
// palpites dos outros antes do prazo.

async function carregar(rodada: string | undefined, minPalpites: number) {
  const jogos = await prisma.jogo.findMany({
    where: { status: 'ENCERRADO', ...(rodada ? { rodada } : {}) },
    select: { id: true },
  })
  const usuarios = await prisma.usuario.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, nome: true, avatarUrl: true, _count: { select: { palpites: true } } },
  })
  const palpites: PalpiteJogo[] = await prisma.palpite.findMany({
    where: { jogoId: { in: jogos.map(j => j.id) } },
    select: { usuarioId: true, jogoId: true, golsCasa: true, golsVisitante: true, pontos: true },
  })
  const participantes = usuarios.filter(u => u._count.palpites >= minPalpites)
  return { jogos, palpites, participantes }
}

export async function buscarRankingZebra(params: {
  rodada?: string
  minPalpites: number
  ousadia: MetricaOusadia
  ordenarPor: OrdemZebra
}): Promise<RankingZebraResponse> {
  const { jogos, palpites, participantes } = await carregar(params.rodada, params.minPalpites)
  const dados = new Map(participantes.map(u => [u.id, u]))

  // A ousadia é calculada com TODOS os palpiteiros do jogo; minPalpites só filtra o ranking.
  const ranking = indiceDeZebra(palpites, params.ousadia, params.ordenarPor)
    .filter(l => dados.has(l.usuarioId))
    .map((l, i) => ({
      ...l,
      nome: dados.get(l.usuarioId)!.nome,
      avatarUrl: dados.get(l.usuarioId)!.avatarUrl,
      posicao: i + 1,
    }))

  return {
    rodada: params.rodada ?? null,
    ousadia: params.ousadia,
    ordenarPor: params.ordenarPor,
    minPalpites: params.minPalpites,
    jogosConsiderados: jogos.length,
    ranking,
  }
}

export async function buscarMstAgregada(params: {
  rodada?: string
  minPalpites: number
  minJogosEmComum: number
}): Promise<MstAgregadaResponse> {
  const { palpites, participantes } = await carregar(params.rodada, params.minPalpites)
  const permitido = new Set(participantes.map(u => u.id))

  const porJogo = new Map<string, PalpiteJogo[]>()
  for (const p of palpites) {
    if (!permitido.has(p.usuarioId)) continue
    porJogo.set(p.jogoId, [...(porJogo.get(p.jogoId) ?? []), p])
  }

  // Só entra no grafo quem palpitou em algum jogo considerado.
  const presentes = new Set([...porJogo.values()].flat().map(p => p.usuarioId))
  const nos = participantes.filter(u => presentes.has(u.id))
  const pares = distanciaMediaAgregada([...porJogo.values()]).filter(a => a.jogosEmComum >= params.minJogosEmComum)
  const emComum = new Map(pares.map(a => [`${a.a}|${a.b}`, a.jogosEmComum]))
  const mst = mstKruskal(nos.map(u => u.id), pares.map(({ a, b, peso }) => ({ a, b, peso })))

  return {
    rodada: params.rodada ?? null,
    minPalpites: params.minPalpites,
    minJogosEmComum: params.minJogosEmComum,
    nos: nos.map(u => ({ id: u.id, nome: u.nome, avatarUrl: u.avatarUrl })),
    arestas: mst.arestas.map(e => ({ origem: e.a, destino: e.b, peso: e.peso, jogosEmComum: emComum.get(`${e.a}|${e.b}`) })),
    pesoTotal: mst.pesoTotal,
    componentes: mst.componentes,
  }
}

export class JogoNaoEncontradoError extends Error {}

export async function buscarDetalheJogoZebra(
  jogoId: string,
  ousadia: MetricaOusadia,
  limite: number
): Promise<DetalheJogoZebraResponse> {
  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    select: {
      id: true, rodada: true, status: true,
      timeCasa: { select: { nome: true } },
      timeVisitante: { select: { nome: true } },
      resultado: { select: { golsCasa: true, golsVisitante: true } },
      palpites: {
        orderBy: { usuarioId: 'asc' },
        select: {
          usuarioId: true, golsCasa: true, golsVisitante: true, pontos: true,
          usuario: { select: { nome: true, avatarUrl: true } },
        },
      },
    },
  })
  if (!jogo || jogo.status !== 'ENCERRADO') {
    throw new JogoNaoEncontradoError('Jogo não encontrado ou ainda não encerrado')
  }

  const valores = ousadiaNoJogo(jogo.palpites, ousadia)
  const porId = new Map(jogo.palpites.map(p => [p.usuarioId, {
    usuarioId: p.usuarioId,
    nome: p.usuario.nome,
    avatarUrl: p.usuario.avatarUrl,
    golsCasa: p.golsCasa,
    golsVisitante: p.golsVisitante,
    pontos: p.pontos,
    ousadia: valores.get(p.usuarioId) ?? 0,
  }]))
  const mst = mstDoJogo(jogo.palpites)

  return {
    jogo: {
      id: jogo.id,
      rodada: jogo.rodada,
      timeCasa: jogo.timeCasa?.nome ?? null,
      timeVisitante: jogo.timeVisitante?.nome ?? null,
      golsCasa: jogo.resultado?.golsCasa ?? null,
      golsVisitante: jogo.resultado?.golsVisitante ?? null,
    },
    ousadia,
    nos: [...porId.values()],
    arestas: mst.arestas.map(e => ({ origem: e.a, destino: e.b, peso: e.peso })),
    pesoTotal: mst.pesoTotal,
    ousadosQueAcertaram: ousadosQueAcertaram(jogo.palpites, ousadia, limite).map(o => porId.get(o.usuarioId)!),
  }
}
