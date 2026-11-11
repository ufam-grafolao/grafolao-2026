import { defineConfig } from 'vitest/config'

// Configuração do Vitest para o backend.
// Os testes ficam em tests/ (fora de src/) para não entrarem no build do tsc.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // Sem meta mínima: o relatório mostra os arquivos que os testes carregam,
      // para acompanhar a cobertura sem forçar um número.
      reporter: [['text', { skipFull: false }], 'html'],
      reportsDirectory: './coverage',
    },
  },
})
