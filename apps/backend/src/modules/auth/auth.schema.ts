// ─── Tipos externos

export interface GoogleProfile {
  sub: string
  name: string
  email: string
  picture: string
}

// ─── Payload do JWT

export interface JwtPayload {
  id: string
  nome: string
  email: string
  avatarUrl: string | null
  role: 'ADMIN' | 'PARTICIPANTE'
}

// ─── Respostas da API 

export interface UsuarioMeResponse {
  id: string
  nome: string
  email: string
  avatarUrl: string | null
  role: 'ADMIN' | 'PARTICIPANTE'
  criadoEm: Date
}

export interface LogoutResponse {
  message: string
}

// ─── JSON Schemas para validação do Fastify 

export const meResponseSchema = {
  200: {
    type: 'object',
    properties: {
      id:        { type: 'string' },
      nome:      { type: 'string' },
      email:     { type: 'string' },
      avatarUrl: { type: ['string', 'null'] },
      role:      { type: 'string', enum: ['ADMIN', 'PARTICIPANTE'] },
      criadoEm:  { type: 'string', format: 'date-time' },
    },
  },
  401: {
    type: 'object',
    properties: {
      error: { type: 'string' },
    },
  },
  404: {
    type: 'object',
    properties: {
      error: { type: 'string' },
    },
  },
}

export const logoutResponseSchema = {
  200: {
    type: 'object',
    properties: {
      message: { type: 'string' },
    },
  },
}