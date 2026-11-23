import { describe, expect, it } from 'vitest'
import { lerBooleano } from '../../src/shared/utils/query.js'

describe('Leitura de booleano da query string', () => {
  it('usa o padrão quando o parâmetro não veio', () => {
    expect(lerBooleano(undefined, true)).toBe(true)
    expect(lerBooleano(undefined, false)).toBe(false)
  })

  it('aceita "false" e "0" para desligar', () => {
    expect(lerBooleano('false', true)).toBe(false)
    expect(lerBooleano('0', true)).toBe(false)
    expect(lerBooleano('FALSE', true)).toBe(false)
  })

  it('aceita "true" e "1" para ligar', () => {
    expect(lerBooleano('true', false)).toBe(true)
    expect(lerBooleano('1', false)).toBe(true)
  })

  it('mantém o padrão com valor desconhecido', () => {
    // Por que: um erro de digitação ("flase") não deve desligar a regra sem querer.
    expect(lerBooleano('flase', true)).toBe(true)
    expect(lerBooleano('', true)).toBe(true)
  })
})
