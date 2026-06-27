import prisma from '../../db/prisma.js'
import type { TipoPalpiteEspecial } from '@prisma/client'
import type {
  PalpiteEspecialResponse,
  SalvarPalpiteEspecialBody,
  ResultadoEspecialResponse,
  InserirResultadoEspecialBody,
} from './palpites-especiais.schema.js'

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ════════════════════════════════════════════════════════════════════════════

export const PRAZO_PALPITES_ESPECIAIS = new Date(
  process.env.PRAZO_PALPITES_ESPECIAIS ?? '2026-06-28T14:59:00-04:00'
)
export const MAX_EDICOES = 2

export const PONTOS_POR_TIPO: Record<TipoPalpiteEspecial, number> = {
  CAMPEAO: 35,
  MVP: 35,
  ARTILHEIRO: 30,
  VICE: 25,
  TERCEIRO_LUGAR: 18,
}

const TODOS_OS_TIPOS: TipoPalpiteEspecial[] = ['CAMPEAO', 'VICE', 'TERCEIRO_LUGAR', 'ARTILHEIRO', 'MVP']
const TIPOS_COM_TIME: TipoPalpiteEspecial[] = ['CAMPEAO', 'VICE', 'TERCEIRO_LUGAR']

function usaTime(tipo: TipoPalpiteEspecial): boolean {
  return TIPOS_COM_TIME.includes(tipo)
}

export class PrazoEncerradoError extends Error {
  constructor() { super('O prazo para palpites especiais já se encerrou.') }
}
export class LimiteEdicoesError extends Error {
  constructor() { super(`Limite de ${MAX_EDICOES} edições atingido para esse palpite.`) }
}
export class ValorInvalidoError extends Error {
  constructor(mensagem: string) { super(mensagem) }
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO PÚBLICA
// ════════════════════════════════════════════════════════════════════════════

export function buscarConfig() {
  return { prazo: PRAZO_PALPITES_ESPECIAIS.toISOString() }
}

// ════════════════════════════════════════════════════════════════════════════
// LEITURA
// ════════════════════════════════════════════════════════════════════════════

export async function buscarMeusPalpitesEspeciais(usuarioId: string): Promise<PalpiteEspecialResponse[]> {
  const existentes = await prisma.palpiteEspecial.findMany({
    where: { usuarioId },
    include: {
      time: { select: { nome: true, codigo: true } },
      jogador: { select: { name: true, fotoUrl: true, time: { select: { nome: true } } } },
    },
  })

  const porTipo = new Map(existentes.map(p => [p.tipo, p]))

  return TODOS_OS_TIPOS.map(tipo => {
    const p = porTipo.get(tipo)
    return {
      tipo,
      timeId: p?.timeId ?? null,
      timeNome: p?.time?.nome ?? null,
      timeCodigo: p?.time?.codigo ?? null,
      jogadorId: p?.jogadorId ?? null,
      jogadorNome: p?.jogador?.name ?? null,
      jogadorTimeNome: p?.jogador?.time?.nome ?? null,
      jogadorFotoUrl: p?.jogador?.fotoUrl ?? null,
      totalEdicoes: p?.totalEdicoes ?? 0,
      pontos: p?.pontos ?? 0,
      acertou: p?.acertou ?? null,
    }
  })
}

export async function buscarResultadosEspeciais(): Promise<ResultadoEspecialResponse[]> {
  const resultados = await prisma.resultadoEspecial.findMany({
    include: { time: { select: { nome: true } }, jogador: { select: { name: true } } },
  })

  return resultados.map(r => ({
    tipo: r.tipo,
    timeId: r.timeId,
    timeNome: r.time?.nome ?? null,
    jogadorId: r.jogadorId,
    jogadorNome: r.jogador?.name ?? null,
    inseridoEm: r.inseridoEm.toISOString(),
  }))
}

// ════════════════════════════════════════════════════════════════════════════
// ESCRITA — usuário
// ════════════════════════════════════════════════════════════════════════════

export async function salvarPalpiteEspecial(
  usuarioId: string,
  body: SalvarPalpiteEspecialBody
): Promise<PalpiteEspecialResponse> {
  if (Date.now() >= PRAZO_PALPITES_ESPECIAIS.getTime()) throw new PrazoEncerradoError()

  const { tipo } = body

  if (usaTime(tipo)) {
    if (!body.timeId) throw new ValorInvalidoError('Selecione um time.')
    const time = await prisma.time.findUnique({ where: { id: body.timeId } })
    if (!time) throw new ValorInvalidoError('Time inválido.')
  } else {
    if (!body.jogadorId) throw new ValorInvalidoError('Selecione um jogador.')
    const jogador = await prisma.jogador.findUnique({ where: { id: body.jogadorId } })
    if (!jogador) throw new ValorInvalidoError('Esse jogador não está disputando a Copa do Mundo 2026.')
  }

  const existente = await prisma.palpiteEspecial.findUnique({
    where: { usuarioId_tipo: { usuarioId, tipo } },
  })

  if (existente && existente.totalEdicoes >= MAX_EDICOES) throw new LimiteEdicoesError()

  const dados = usaTime(tipo)
    ? { timeId: body.timeId!, jogadorId: null }
    : { timeId: null, jogadorId: body.jogadorId! }

  const salvo = await prisma.palpiteEspecial.upsert({
    where: { usuarioId_tipo: { usuarioId, tipo } },
    create: { usuarioId, tipo, ...dados, totalEdicoes: 0 },
    update: { ...dados, totalEdicoes: { increment: 1 } },
    include: {
      time: { select: { nome: true, codigo: true } },
      jogador: { select: { name: true, fotoUrl: true, time: { select: { nome: true } } } },
    },
  })

  return {
    tipo: salvo.tipo,
    timeId: salvo.timeId,
    timeNome: salvo.time?.nome ?? null,
    timeCodigo: salvo.time?.codigo ?? null,
    jogadorId: salvo.jogadorId,
    jogadorNome: salvo.jogador?.name ?? null,
    jogadorTimeNome: salvo.jogador?.time?.nome ?? null,
    jogadorFotoUrl: salvo.jogador?.fotoUrl ?? null,
    totalEdicoes: salvo.totalEdicoes,
    pontos: salvo.pontos,
    acertou: salvo.acertou,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ESCRITA — admin
// ════════════════════════════════════════════════════════════════════════════

export async function inserirResultadoEspecial(
  inseridoPor: string,
  body: InserirResultadoEspecialBody
): Promise<{ palpitesAtualizados: number }> {
  const { tipo } = body

  if (usaTime(tipo)) {
    if (!body.timeId) throw new ValorInvalidoError('Selecione o time correto.')
    const time = await prisma.time.findUnique({ where: { id: body.timeId } })
    if (!time) throw new ValorInvalidoError('Time inválido.')
  } else {
    if (!body.jogadorId) throw new ValorInvalidoError('Selecione o jogador correto.')
    const jogador = await prisma.jogador.findUnique({ where: { id: body.jogadorId } })
    if (!jogador) throw new ValorInvalidoError('Jogador inválido.')
  }

  const dados = usaTime(tipo)
    ? { timeId: body.timeId!, jogadorId: null }
    : { timeId: null, jogadorId: body.jogadorId! }

  await prisma.resultadoEspecial.upsert({
    where: { tipo },
    create: { tipo, ...dados, inseridoPor },
    update: { ...dados, inseridoPor, inseridoEm: new Date() },
  })

  const palpites = await prisma.palpiteEspecial.findMany({ where: { tipo } })
  const pontosPorAcerto = PONTOS_POR_TIPO[tipo]

  const atualizacoes = palpites.map(p => {
    const acertou = usaTime(tipo) ? p.timeId === dados.timeId : p.jogadorId === dados.jogadorId
    return prisma.palpiteEspecial.update({
      where: { id: p.id },
      data: { acertou, pontos: acertou ? pontosPorAcerto : 0 },
    })
  })

  await prisma.$transaction(atualizacoes)
  return { palpitesAtualizados: atualizacoes.length }
}