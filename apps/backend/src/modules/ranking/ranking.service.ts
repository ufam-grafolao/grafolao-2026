import prisma from '../../db/prisma.js'

const LIMIT_PADRAO = 20

export async function rankingGeral(page: number, limit: number = LIMIT_PADRAO, usuarioId?: string) {
  const [palpitesSomados, especialisSomados, acertosCompletos, acertosParciais, totalUsuarios] = await Promise.all([
    prisma.palpite.groupBy({
      by: ['usuarioId'],
      _sum: { pontos: true },
    }),
    prisma.palpiteEspecial.groupBy({
      by: ['usuarioId'],
      _sum: { pontos: true },
    }),
    prisma.palpite.groupBy({
      by: ['usuarioId'],
      where: { status: 'ACERTO_PLACAR' },
      _count: { _all: true },
    }),
    prisma.palpite.groupBy({
      by: ['usuarioId'],
      where: { status: 'ACERTO_VENCEDOR' },
      _count: { _all: true },
    }),
    prisma.usuario.count({ where: { ativo: true } }),
  ])

  const mapPalpites   = new Map(palpitesSomados.map(p => [p.usuarioId, p._sum.pontos ?? 0]))
  const mapEspeciais  = new Map(especialisSomados.map(p => [p.usuarioId, p._sum.pontos ?? 0]))
  const mapCompletos  = new Map(acertosCompletos.map(p => [p.usuarioId, p._count._all]))
  const mapParciais   = new Map(acertosParciais.map(p => [p.usuarioId, p._count._all]))

  const usuarios = await prisma.usuario.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, avatarUrl: true },
  })

  const ranking = usuarios
    .map(u => {
      const pontosPalpites   = mapPalpites.get(u.id)  ?? 0
      const pontosEspeciais  = mapEspeciais.get(u.id) ?? 0
      return {
        usuarioId: u.id,
        nome: u.nome,
        avatarUrl: u.avatarUrl,
        totalPontos: pontosPalpites + pontosEspeciais,
        pontosPalpites,
        pontosEspeciais,
        acertosCompletos: mapCompletos.get(u.id) ?? 0,
        acertosParciais:  mapParciais.get(u.id)  ?? 0,
      }
    })
    .sort((a, b) => b.totalPontos - a.totalPontos || b.acertosCompletos - a.acertosCompletos)
    .map((u, i) => ({ ...u, posicao: i + 1 }))

  const totalPages = Math.ceil(totalUsuarios / limit)
  const offset = (page - 1) * limit
  const data = ranking.slice(offset, offset + limit)
  const minhaEntrada = usuarioId ? (ranking.find(u => u.usuarioId === usuarioId) ?? null) : null

  return { data, total: totalUsuarios, page, totalPages, minhaEntrada }
}
