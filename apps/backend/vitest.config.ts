import { defineConfig } from 'vitest/config'

// Configuração do Vitest para o backend.
// Os testes ficam em tests/ (fora de src/) para não entrarem no build do tsc.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
