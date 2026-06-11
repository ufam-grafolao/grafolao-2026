// ─── Bodies ───────────────────────────────────────────────────────────────────

export interface InserirResultadoBody {
  golsCasa: number
  golsVisitante: number
  artilheirosCasa?: string[]
  artilheirosVisitante?: string[]
  cartoesAmarelos?: number
  cartoesVermelhosIndiretos?: number
  cartoesVermelhosDiretos?: number
  cartoesAmarelosMaisVermelho?: number
}

export interface AtualizarStatusBody {
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'ENCERRADO' | 'BLOQUEADO'
}

// ─── JSON Schemas ─────────────────────────────────────────────────────────────

export const inserirResultadoBodySchema = {
  body: {
    type: 'object',
    required: ['golsCasa', 'golsVisitante'],
    properties: {
      golsCasa:      { type: 'integer', minimum: 0, maximum: 20 },
      golsVisitante: { type: 'integer', minimum: 0, maximum: 20 },
      artilheirosCasa:      { type: 'array', items: { type: 'string' }, default: [] },
      artilheirosVisitante: { type: 'array', items: { type: 'string' }, default: [] },
      cartoesAmarelos:             { type: 'integer', minimum: 0, default: 0 },
      cartoesVermelhosIndiretos:   { type: 'integer', minimum: 0, default: 0 },
      cartoesVermelhosDiretos:     { type: 'integer', minimum: 0, default: 0 },
      cartoesAmarelosMaisVermelho: { type: 'integer', minimum: 0, default: 0 },
    },
  },
}

export const atualizarStatusBodySchema = {
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['AGENDADO', 'EM_ANDAMENTO', 'ENCERRADO', 'BLOQUEADO'],
      },
    },
  },
}