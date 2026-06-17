// ─── Enums

export type TipoComunidade = 'PUBLICA' | 'PRIVADA'
export type RoleComunidade = 'DONO' | 'MODERADOR' | 'MEMBRO'

// ─── Tipos de resposta

export interface UsuarioResumoResponse {
  id: string
  nome: string
  avatarUrl: string | null
}

export interface ComunidadeResponse {
  id: string
  nome: string
  descricao: string | null
  tipo: TipoComunidade
  avatarUrl: string | null
  codigoCovite: string | null
  donoId: string
  criadoEm: Date
}

export interface MembroResponse {
  usuarioId: string
  role: RoleComunidade
  entradoEm: Date
  usuario: UsuarioResumoResponse
}

export interface RankingMembroResponse {
  posicao: number
  usuarioId: string
  nome: string
  avatarUrl: string | null
  role: RoleComunidade
  totalPontos: number
  pontosPalpites: number
  pontosEspeciais: number
}

// ─── Body params

export interface CriarComunidadeBody {
  nome: string
  descricao?: string
  tipo: TipoComunidade
  avatarUrl?: string
}

export interface EntrarComunidadeBody {
  codigo?: string
}

export interface PromoverMembroBody {
  usuarioId: string
  role: 'MODERADOR' | 'MEMBRO'
}

export interface AlterarTipoComunidadeBody {
  tipo: TipoComunidade
}


// ─── JSON Schemas

const usuarioResumoSchema = {
  type: 'object',
  properties: {
    id:        { type: 'string' },
    nome:      { type: 'string' },
    avatarUrl: { type: ['string', 'null'] },
  },
}

const comunidadeSchema = {
  type: 'object',
  properties: {
    id:           { type: 'string' },
    nome:         { type: 'string' },
    descricao:    { type: ['string', 'null'] },
    tipo:         { type: 'string' },
    avatarUrl:    { type: ['string', 'null'] },
    codigoCovite: { type: ['string', 'null'] },
    donoId:       { type: 'string' },
    criadoEm:     { type: 'string', format: 'date-time' },
  },
}

const membroSchema = {
  type: 'object',
  properties: {
    usuarioId: { type: 'string' },
    role:      { type: 'string' },
    entradoEm: { type: 'string', format: 'date-time' },
    usuario:   usuarioResumoSchema,
  },
}

const rankingMembroSchema = {
  type: 'object',
  properties: {
    posicao:         { type: 'number' },
    usuarioId:       { type: 'string' },
    nome:            { type: 'string' },
    avatarUrl:       { type: ['string', 'null'] },
    role:            { type: 'string' },
    totalPontos:     { type: 'number' },
    pontosPalpites:  { type: 'number' },
    pontosEspeciais: { type: 'number' },
  },
}

const erroSchema = {
  type: 'object',
  properties: { error: { type: 'string' } },
}

export const criarComunidadeResponseSchema = {
  201: comunidadeSchema,
  403: erroSchema,
}

export const entrarComunidadeResponseSchema = {
  201: membroSchema,
  401: erroSchema,
  409: erroSchema,
}

export const rankingResponseSchema = {
  200: { type: 'array', items: rankingMembroSchema },
}

export const comunidadesResponseSchema = {
  200: { type: 'array', items: comunidadeSchema },
}

export const criarComunidadeBodySchema = {
  body: {
    type: 'object',
    required: ['nome', 'tipo'],
    properties: {
      nome:      { type: 'string', minLength: 3, maxLength: 50 },
      descricao: { type: 'string', maxLength: 200 },
      tipo:      { type: 'string', enum: ['PUBLICA', 'PRIVADA'] },
      avatarUrl: { type: 'string' },
    },
  },
}

export const promoverMembroBodySchema = {
  body: {
    type: 'object',
    required: ['usuarioId', 'role'],
    properties: {
      usuarioId: { type: 'string', format: 'uuid' },
      role:      { type: 'string', enum: ['MODERADOR', 'MEMBRO'] },
    },
  },
}

export const alterarTipoBodySchema = {
  body: {
    type: 'object',
    required: ['tipo'],
    properties: {
      tipo: { type: 'string', enum: ['PUBLICA', 'PRIVADA'] },
    },
  },
}

export interface AtualizarComunidadeBody {
  nome?: string
  descricao?: string
}

export const atualizarComunidadeBodySchema = {
  body: {
    type: 'object',
    properties: {
      nome:      { type: 'string', minLength: 3, maxLength: 50 },
      descricao: { type: 'string', maxLength: 200 },
    },
  },
}