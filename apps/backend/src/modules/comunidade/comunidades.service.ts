import prisma from '../../db/prisma.js'
import { randomBytes } from 'crypto'
import type {
  CriarComunidadeBody,
  EntrarComunidadeBody,
  PromoverMembroBody,
} from './comunidade.schema.js'

const LIMITE_COMUNIDADES = 3

export async function criarComunidade(usuarioId: string, data: CriarComunidadeBody) {
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuarioId },
    select: { comunidadesCriadas: true },
  })

  if (usuario.comunidadesCriadas >= LIMITE_COMUNIDADES) {
    throw new Error('LIMITE_ATINGIDO')
  }

  const codigoCovite = data.tipo === 'PRIVADA'
    ? randomBytes(6).toString('hex')
    : null

  const [comunidade] = await prisma.$transaction([
    prisma.comunidade.create({
      data: {
        ...data,
        codigoCovite,
        donoId: usuarioId,
        membros: {
          create: { usuarioId, role: 'DONO' },
        },
      },
    }),
    prisma.usuario.update({
      where: { id: usuarioId },
      data: { comunidadesCriadas: { increment: 1 } },
    }),
  ])

  return comunidade
}

export async function listarComunidades(usuarioId: string) {
  return prisma.comunidade.findMany({
    where: {
      ativo: true,
      OR: [
        { tipo: 'PUBLICA' },
        { membros: { some: { usuarioId } } },
      ],
    },
    orderBy: { criadoEm: 'desc' },
  })
}

export async function entrarComunidade(
  usuarioId: string,
  comunidadeId: string,
  data: EntrarComunidadeBody
) {
  const comunidade = await prisma.comunidade.findUniqueOrThrow({
    where: { id: comunidadeId, ativo: true },
  })

  const jaEMembro = await prisma.membroComunidade.findUnique({
    where: { comunidadeId_usuarioId: { comunidadeId, usuarioId } },
  })
  if (jaEMembro) throw new Error('JA_MEMBRO')

  if (comunidade.tipo === 'PRIVADA') {
    if (!data.codigo || data.codigo !== comunidade.codigoCovite) {
      throw new Error('CODIGO_INVALIDO')
    }
  }

  return prisma.membroComunidade.create({
    data: { comunidadeId, usuarioId, role: 'MEMBRO' },
    include: { usuario: { select: { id: true, nome: true, avatarUrl: true } } },
  })
}

export async function expulsarMembro(
  solicitanteId: string,
  comunidadeId: string,
  membroId: string
) {
  const solicitante = await prisma.membroComunidade.findUniqueOrThrow({
    where: { comunidadeId_usuarioId: { comunidadeId, usuarioId: solicitanteId } },
  })

  if (!['DONO', 'MODERADOR'].includes(solicitante.role)) {
    throw new Error('SEM_PERMISSAO')
  }

  const alvo = await prisma.membroComunidade.findUniqueOrThrow({
    where: { comunidadeId_usuarioId: { comunidadeId, usuarioId: membroId } },
  })

  if (solicitante.role === 'MODERADOR' && ['MODERADOR', 'DONO'].includes(alvo.role)) {
    throw new Error('SEM_PERMISSAO')
  }

  return prisma.membroComunidade.delete({
    where: { comunidadeId_usuarioId: { comunidadeId, usuarioId: membroId } },
  })
}

export async function promoverMembro(
  solicitanteId: string,
  comunidadeId: string,
  data: PromoverMembroBody
) {
  const solicitante = await prisma.membroComunidade.findUniqueOrThrow({
    where: { comunidadeId_usuarioId: { comunidadeId, usuarioId: solicitanteId } },
  })

  if (solicitante.role !== 'DONO') throw new Error('SEM_PERMISSAO')

  return prisma.membroComunidade.update({
    where: { comunidadeId_usuarioId: { comunidadeId, usuarioId: data.usuarioId } },
    data: { role: data.role },
  })
}

export async function deletarComunidade(usuarioId: string, comunidadeId: string) {
  const membro = await prisma.membroComunidade.findUniqueOrThrow({
    where: { comunidadeId_usuarioId: { comunidadeId, usuarioId } },
  })

  if (membro.role !== 'DONO') throw new Error('SEM_PERMISSAO')

  await prisma.$transaction([
    prisma.membroComunidade.deleteMany({ where: { comunidadeId } }),
    prisma.comunidade.update({
      where: { id: comunidadeId },
      data: { ativo: false },
    }),
    prisma.usuario.update({
      where: { id: usuarioId },
      data: { comunidadesCriadas: { decrement: 1 } },
    }),
  ])
}

export async function rankingComunidade(comunidadeId: string) {
  const membros = await prisma.membroComunidade.findMany({
    where: { comunidadeId },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          avatarUrl: true,
          palpites: { select: { pontos: true } },
          palpitesEspeciais: { select: { pontos: true } },
        },
      },
    },
  })

  return membros
    .map(({ usuario, role }) => {
      const pontosPalpites = usuario.palpites.reduce((acc, p) => acc + p.pontos, 0)
      const pontosEspeciais = usuario.palpitesEspeciais.reduce((acc, p) => acc + p.pontos, 0)
      return {
        usuarioId: usuario.id,
        nome: usuario.nome,
        avatarUrl: usuario.avatarUrl,
        role,
        totalPontos: pontosPalpites + pontosEspeciais,
        pontosPalpites,
        pontosEspeciais,
      }
    })
    .sort((a, b) => b.totalPontos - a.totalPontos)
    .map((m, i) => ({ ...m, posicao: i + 1 }))
}