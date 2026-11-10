import { describe, expect, it } from 'vitest'
import { getNomePt } from '../src/shared/utils/nomes-times.js'

// Teste "smoke": não valida uma regra de negócio, apenas prova que o Vitest
// executa TypeScript ESM e importa módulos do backend sem precisar de banco.
// Se este teste quebrar, o problema é a configuração do runner, não o domínio.
describe('smoke: configuração do Vitest', () => {
  it('traduz o nome de uma seleção para português', () => {
    // Arrange
    const nomeEmIngles = 'Kenya'

    // Act
    const resultado = getNomePt(nomeEmIngles)

    // Assert
    expect(resultado).toBe('Quênia')
  })

  it('devolve o próprio nome quando não há tradução cadastrada', () => {
    // Por que: o fallback evita exibir "undefined" para times fora da tabela.
    expect(getNomePt('Time Inexistente FC')).toBe('Time Inexistente FC')
  })
})
