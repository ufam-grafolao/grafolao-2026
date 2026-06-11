// ─── Enums 

export type Fase =
  | 'GRUPOS'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTAS'
  | 'SEMIFINAL'
  | 'TERCEIRO_LUGAR'
  | 'FINAL'

export type StatusJogo = 'AGENDADO' | 'EM_ANDAMENTO' | 'ENCERRADO' | 'BLOQUEADO'

// ─── Tipos de resposta 

export interface TimeResponse {
  id: string
  nome: string
  codigo: string | null
  grupo: string | null
}

export interface ResultadoResponse {
  golsCasa: number
  golsVisitante: number
}

export interface JogoResponse {
  id: string
  num: number | null
  fase: Fase
  rodada: string
  grupo: string | null
  dataHora: Date
  local: string
  status: StatusJogo
  timeCasa: TimeResponse | null
  timeVisitante: TimeResponse | null
  timeCasaRef: string | null
  timeVisitanteRef: string | null
  resultado: ResultadoResponse | null
}

// ─── Query params 

export interface JogosQueryParams {
  fase?: Fase
  grupo?: string
  rodada?: string
  status?: StatusJogo
}

// ─── JSON Schemas 

const timeSchema = {
  type: 'object',
  nullable: true,
  properties: {
    id:     { type: 'string' },
    nome:   { type: 'string' },
    codigo: { type: ['string', 'null'] },
    grupo:  { type: ['string', 'null'] },
  },
}

const resultadoSchema = {
  type: 'object',
  nullable: true,
  properties: {
    golsCasa:      { type: 'number' },
    golsVisitante: { type: 'number' },
    artilheirosCasa:      { type: 'array', items: { type: 'string' } },
    artilheirosVisitante: { type: 'array', items: { type: 'string' } },
  },
}

const jogoSchema = {
  type: 'object',
  properties: {
    id:               { type: 'string' },
    num:              { type: ['number', 'null'] },
    fase:             { type: 'string' },
    rodada:           { type: 'string' },
    grupo:            { type: ['string', 'null'] },
    dataHora:         { type: 'string', format: 'date-time' },
    local:            { type: 'string' },
    status:           { type: 'string' },
    timeCasa:         timeSchema,
    timeVisitante:    timeSchema,
    timeCasaRef:      { type: ['string', 'null'] },
    timeVisitanteRef: { type: ['string', 'null'] },
    resultado:        resultadoSchema,
  },
}

export const jogosResponseSchema = {
  200: {
    type: 'array',
    items: jogoSchema,
  },
}

export const jogoResponseSchema = {
  200: jogoSchema,
  404: {
    type: 'object',
    properties: { error: { type: 'string' } },
  },
}

export const jogosQuerySchema = {
  querystring: {
    type: 'object',
    properties: {
      fase:   { type: 'string' },
      grupo:  { type: 'string' },
      rodada: { type: 'string' },
      status: { type: 'string' },
    },
  },
}