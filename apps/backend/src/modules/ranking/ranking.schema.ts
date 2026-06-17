export interface RankingQuerystring {
  page?: number
  limit?: number
}

const entradaRankingSchema = {
  type: 'object',
  properties: {
    posicao:        { type: 'number' },
    usuarioId:      { type: 'string' },
    nome:           { type: 'string' },
    avatarUrl:      { type: ['string', 'null'] },
    totalPontos:      { type: 'number' },
    pontosPalpites:   { type: 'number' },
    pontosEspeciais:  { type: 'number' },
    acertosCompletos: { type: 'number' },
    acertosParciais:  { type: 'number' },
  },
}

export const rankingGeralResponseSchema = {
  200: {
    type: 'object',
    properties: {
      data:         { type: 'array', items: entradaRankingSchema },
      total:        { type: 'number' },
      page:         { type: 'number' },
      totalPages:   { type: 'number' },
      minhaEntrada: { ...entradaRankingSchema, nullable: true },
    },
  },
}

export const rankingGeralQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      page:  { type: 'number', minimum: 1, default: 1 },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
    },
  },
}
