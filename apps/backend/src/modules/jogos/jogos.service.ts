import prisma from '../../db/prisma.js'
import type { Fase, StatusJogo, JogosQueryParams, JogoResponse } from './jogos.schema.js'

const jogoSelect = {
  id: true,
  num: true,
  fase: true,
  rodada: true,
  grupo: true,
  dataHora: true,
  local: true,
  status: true,
  timeCasaRef: true,
  timeVisitanteRef: true,
  timeCasa: {
    select: { id: true, nome: true, codigo: true, grupo: true },
  },
  timeVisitante: {
    select: { id: true, nome: true, codigo: true, grupo: true },
  },
  resultado: {
    select: {
      golsCasa: true,
      golsVisitante: true,
      artilheirosCasa: true,
      artilheirosVisitante: true,
    },
  },
}

export async function buscarJogos(filtros: JogosQueryParams = {}): Promise<JogoResponse[] | null> {
  const where: any = {}

  if (filtros.fase)   where.fase   = filtros.fase as Fase
  if (filtros.grupo)  where.grupo  = filtros.grupo
  if (filtros.rodada) where.rodada = filtros.rodada
  if (filtros.status) where.status = filtros.status as StatusJogo

  return prisma.jogo.findMany({
    where,
    select: jogoSelect,
    orderBy: { dataHora: 'asc' },
  }) as Promise<JogoResponse[] | null>
}

// Busca jogos do dia atual

export async function buscarJogosHoje(dataManaus?: string) {

  let inicioDia: Date
  let fimDia: Date

  if (dataManaus) {
    const dataLocal = new Date(`${dataManaus}T00:00:00`)
    
    inicioDia = new Date(dataLocal)
    inicioDia.setHours(0, 0, 0, 0)

    fimDia = new Date(dataLocal)
    fimDia.setHours(23, 59, 59, 999)
  } else {

    
    const agoraManaus = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Manaus" }))
    
    inicioDia = new Date(agoraManaus)
    inicioDia.setHours(0, 0, 0, 0)

    fimDia = new Date(agoraManaus)
    fimDia.setHours(23, 59, 59, 999)
  }

  return prisma.jogo.findMany({
    where: {
      dataHora: {
        gte: inicioDia,
        lte: fimDia,
      },
      status: {
        not: 'BLOQUEADO',
      },
    },
    select: jogoSelect,
    orderBy: { dataHora: 'asc' },
  })
}

// Busca jogo por ID

export async function buscarJogoPorId(id: string) {
  return prisma.jogo.findUnique({
    where: { id },
    select: jogoSelect,
  })
}

export async function buscarJogoPorTime(timeId: string) {
  return prisma.jogo.findMany({
    where: {
      OR: [
        { timeCasaId: timeId },
        { timeVisitanteId: timeId },
      ]
    },
    select: jogoSelect,
    orderBy: { dataHora: 'asc' },
  }) as Promise<JogoResponse[] | null>;
}
