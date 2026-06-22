const cliquesSchema = {
  type: 'array',
  item: {
    type: 'object',
    properties: {
      usuarios: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nome: { type: 'string' },
            avatarUrl: { type: 'string' },
          },
          required: ['id', 'nome', 'avatarUrl'],
        },
      },
      jogos: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['usuarios', 'jogos'],
  }
}

export const cliquesResponseSchema = {
  200: cliquesSchema,
  400: { type: 'object', properties: { error: { type: 'string' } } },
  403: { type: 'object', properties: { error: { type: 'string' } } },
  404: { type: 'object', properties: { error: { type: 'string' } } },
}