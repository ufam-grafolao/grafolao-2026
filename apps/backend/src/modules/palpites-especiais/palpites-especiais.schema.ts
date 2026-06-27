import type { TipoPalpiteEspecial } from '@prisma/client'

export interface PalpiteEspecialResponse {
  tipo: TipoPalpiteEspecial
  timeId: string | null
  timeNome: string | null
  timeCodigo: string | null
  jogadorId: string | null
  jogadorNome: string | null
  jogadorTimeNome: string | null
  jogadorFotoUrl: string | null
  totalEdicoes: number
  pontos: number
  acertou: boolean | null
}

export interface SalvarPalpiteEspecialBody {
  tipo: TipoPalpiteEspecial
  timeId?: string
  jogadorId?: string
}

export interface ResultadoEspecialResponse {
  tipo: TipoPalpiteEspecial
  timeId: string | null
  timeNome: string | null
  jogadorId: string | null
  jogadorNome: string | null
  inseridoEm: string
}

export interface InserirResultadoEspecialBody {
  tipo: TipoPalpiteEspecial
  timeId?: string
  jogadorId?: string
}

const TIPOS_ENUM = ['CAMPEAO', 'VICE', 'TERCEIRO_LUGAR', 'ARTILHEIRO', 'MVP']

const palpiteEspecialItemSchema = {
  type: 'object',
  properties: {
    tipo:            { type: 'string', enum: TIPOS_ENUM },
    timeId:          { type: ['string', 'null'] },
    timeNome:        { type: ['string', 'null'] },
    timeCodigo:      { type: ['string', 'null'] },
    jogadorId:       { type: ['string', 'null'] },
    jogadorNome:     { type: ['string', 'null'] },
    jogadorTimeNome: { type: ['string', 'null'] },
    jogadorFotoUrl:  { type: ['string', 'null'] },
    totalEdicoes:    { type: 'integer' },
    pontos:          { type: 'integer' },
    acertou:         { type: ['boolean', 'null'] },
  },
}

export const meusPalpitesEspeciaisResponseSchema = {
  200: { type: 'array', items: palpiteEspecialItemSchema },
}

export const salvarPalpiteEspecialResponseSchema = {
  200: palpiteEspecialItemSchema,
}

export const resultadosEspeciaisResponseSchema = {
  200: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        tipo:        { type: 'string', enum: TIPOS_ENUM },
        timeId:      { type: ['string', 'null'] },
        timeNome:    { type: ['string', 'null'] },
        jogadorId:   { type: ['string', 'null'] },
        jogadorNome: { type: ['string', 'null'] },
        inseridoEm:  { type: 'string' },
      },
    },
  },
}

export const bodySalvarPalpiteEspecialSchema = {
  type: 'object',
  required: ['tipo'],
  properties: {
    tipo:      { type: 'string', enum: TIPOS_ENUM },
    timeId:    { type: 'string' },
    jogadorId: { type: 'string' },
  },
}