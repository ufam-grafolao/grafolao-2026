// ─── Enums ────────────────────────────────────────────────────────────────────

export type StatusPalpite = 'PENDENTE' | 'ACERTO_PLACAR' | 'ACERTO_RESULTADO' | 'ERRO'

// ─── Body de criação/edição ───────────────────────────────────────────────────

export interface CriarPalpiteBody {
  jogoId: string
  golsCasa: number
  golsVisitante: number
}

// ─── Respostas ────────────────────────────────────────────────────────────────

export interface PalpiteResponse {
  id: string
  jogoId: string
  golsCasa: number
  golsVisitante: number
  pontos: number
  status: StatusPalpite
  criadoEm: Date
  atualizadoEm: Date
  jogo: {
    id: string
    rodada: string
    grupo: string | null
    dataHora: Date
    timeCasa: { nome: string } | null
    timeVisitante: { nome: string } | null
    timeCasaRef: string | null
    timeVisitanteRef: string | null
  }
}

// ─── JSON Schemas ─────────────────────────────────────────────────────────────

export const criarPalpiteBodySchema = {
  body: {
    type: 'object',
    required: ['jogoId', 'golsCasa', 'golsVisitante'],
    properties: {
      jogoId:        { type: 'string' },
      golsCasa:      { type: 'integer', minimum: 0, maximum: 20 },
      golsVisitante: { type: 'integer', minimum: 0, maximum: 20 },
    },
  },
}

const jogoResumidoSchema = {
  type: 'object',
  properties: {
    id:       { type: 'string' },
    rodada:   { type: 'string' },
    grupo:    { type: ['string', 'null'] },
    dataHora: { type: 'string', format: 'date-time' },
    timeCasa:      { type: ['object', 'null'], properties: { nome: { type: 'string' } } },
    timeVisitante: { type: ['object', 'null'], properties: { nome: { type: 'string' } } },
    timeCasaRef:      { type: ['string', 'null'] },
    timeVisitanteRef: { type: ['string', 'null'] },
  },
}

const palpiteSchema = {
  type: 'object',
  properties: {
    id:            { type: 'string' },
    jogoId:        { type: 'string' },
    golsCasa:      { type: 'integer' },
    golsVisitante: { type: 'integer' },
    pontos:        { type: 'integer' },
    status:        { type: 'string' },
    criadoEm:      { type: 'string', format: 'date-time' },
    atualizadoEm:  { type: 'string', format: 'date-time' },
    jogo:          jogoResumidoSchema,
  },
}

export const palpiteResponseSchema = {
  200: palpiteSchema,
  400: { type: 'object', properties: { error: { type: 'string' } } },
  403: { type: 'object', properties: { error: { type: 'string' } } },
  404: { type: 'object', properties: { error: { type: 'string' } } },
}

export const meusAlpitesResponseSchema = {
  200: {
    type: 'array',
    items: palpiteSchema,
  },
}