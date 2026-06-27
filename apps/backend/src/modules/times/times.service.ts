import prisma from '../../db/prisma.js'

export interface TimeResponse {
  id: string
  nome: string
  codigo: string | null
  grupo: string | null
}

export async function listarTimes(): Promise<TimeResponse[]> {
  const times = await prisma.time.findMany({
    select: { id: true, nome: true, codigo: true, grupo: true },
    orderBy: [{ grupo: 'asc' }, { nome: 'asc' }],
  })
  return times
}
