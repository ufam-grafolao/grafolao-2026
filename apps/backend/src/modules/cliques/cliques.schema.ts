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
    }
  }
}

export const cliquesResponseSchema = {
  200: cliquesSchema,
  400: { type: 'object', properties: { error: { type: 'string' } } },
  403: { type: 'object', properties: { error: { type: 'string' } } },
  404: { type: 'object', properties: { error: { type: 'string' } } },
}