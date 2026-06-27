export const timesResponseSchema = {
  200: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id:     { type: 'string' },
        nome:   { type: 'string' },
        codigo: { type: ['string', 'null'] },
        grupo:  { type: ['string', 'null'] },
      },
    },
  },
}
