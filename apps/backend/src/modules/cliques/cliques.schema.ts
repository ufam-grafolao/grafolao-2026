// ─── Enums ────────────────────────────────────────────────────────────────────

export type CliquesOrdem = 'vertices' | 'arestas';

// ─── Respostas ────────────────────────────────────────────────────────────────

export type Biclique = [number[], number[]];

export type CliqueUsuario = {
  id: string,
  nome: string,
  avatarUrl?: string,
}

export type CliqueJogo = {
  id: string,
  timeCasa?: string,
  timeVisitante?: string,
  golsCasa?: number,
  golsVisitante?: number,
}

export type CliquesResponse = {
  usuarios: CliqueUsuario[],
  jogos: CliqueJogo[],
  bicliques: Biclique[],
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export type CliquesQueryParams = {
  ordem?: CliquesOrdem,
  minimoUsuarios?: number,
  minimoJogos?: number,
  comigo?: boolean,
  comJogo?: string,
}

// ─── JSON Schemas ─────────────────────────────────────────────────────────────

const cliquesSchema = {
  type: 'object',
  properties: {
    usuarios: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nome: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
        },
        required: ['id', 'nome'],
      },
    },
    jogos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          timeCasa: { type: 'string', nullable: true },
          timeVisitante: { type: 'string', nullable: true },
          golsCasa: { type: 'number', nullable: true },
          golsVisitante: { type: 'number', nullable: true },
        },
        required: ['id'],
      },
    },
    bicliques: {
      type: 'array',
      items: {
        type: 'array',
        prefixItems: [
          {
            type: 'array',
            description: 'Índices de usuários da biclique',
            items: { type: 'number' },
          },
          {
            type: 'array',
            description: 'Índices de jogos da biclique',
            items: { type: 'number' },
          }
        ]
      }
    },
    totalUsuarios: { type: 'number' },
    totalJogos: { type: 'number' },
    totalBicliques: { type: 'number' },
  }
}

export const cliquesQuerySchema = {
  type: 'object',
  properties: {
    ordem: {
      type: 'string',
      enum: ['vertices', 'arestas', 'usuarios', 'jogos'],
    },
    minimoUsuarios: {
      type: 'number',
      minimum: 0,
    },
    minimoJogos: {
      type: 'number',
      minimum: 0,
    },
    comigo: {
      type: 'boolean',
      default: false
    },
    comJogo: { type: 'string' },
  },
};

export const cliquesResponseSchema = {
  200: cliquesSchema,
  400: { type: 'object', properties: { error: { type: 'string' } } },
  403: { type: 'object', properties: { error: { type: 'string' } } },
  404: { type: 'object', properties: { error: { type: 'string' } } },
}