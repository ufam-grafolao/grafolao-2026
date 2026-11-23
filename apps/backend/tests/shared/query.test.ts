import { describe, expect, it } from 'vitest'
import { lerBooleano, lerNumero, lerNumeroOpcional } from '../../src/shared/utils/query.js'

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

describe('Leitura de número da query string', () => {
  it('converte o texto em número', () => {
    expect(lerNumero('95', 90)).toBe(95)
  })

  it('usa o padrão quando ausente, vazio ou inválido', () => {
    expect(lerNumero(undefined, 90)).toBe(90)
    expect(lerNumero('', 90)).toBe(90)
    expect(lerNumero('abc', 90)).toBe(90)
  })

  it('limita ao intervalo pedido', () => {
    expect(lerNumero('150', 90, { minimo: 0, maximo: 100 })).toBe(100)
    expect(lerNumero('-5', 90, { minimo: 0, maximo: 100 })).toBe(0)
  })

  it('parâmetro opcional ausente fica undefined', () => {
    expect(lerNumeroOpcional(undefined)).toBeUndefined()
    expect(lerNumeroOpcional('x')).toBeUndefined()
    expect(lerNumeroOpcional('0.8', { minimo: 0, maximo: 1 })).toBe(0.8)
  })
})
