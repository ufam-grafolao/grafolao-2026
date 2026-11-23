/**
 * Lê um parâmetro booleano da query string.
 * Aceita "true"/"1" e "false"/"0" (sem diferenciar maiúsculas). Ausente ou vazio
 * devolve o padrão; qualquer outro valor também devolve o padrão, para que um
 * erro de digitação não desligue uma regra sem querer.
 */
export function lerBooleano(valor: string | undefined, padrao: boolean): boolean {
  if (valor === undefined) return padrao
  const normalizado = valor.trim().toLowerCase()
  if (normalizado === 'true' || normalizado === '1') return true
  if (normalizado === 'false' || normalizado === '0') return false
  return padrao
}

/**
 * Lê um número da query string. Ausente, vazio ou não numérico devolve o padrão.
 * Se `minimo`/`maximo` forem dados, o valor é limitado a esse intervalo.
 */
export function lerNumero(
  valor: string | undefined,
  padrao: number,
  limites: { minimo?: number; maximo?: number } = {}
): number {
  if (valor === undefined || valor.trim() === '') return padrao
  const n = Number(valor)
  if (!Number.isFinite(n)) return padrao
  const { minimo = -Infinity, maximo = Infinity } = limites
  return Math.min(maximo, Math.max(minimo, n))
}

/** Como lerNumero, mas ausente/inválido devolve undefined (parâmetro opcional). */
export function lerNumeroOpcional(
  valor: string | undefined,
  limites: { minimo?: number; maximo?: number } = {}
): number | undefined {
  const n = lerNumero(valor, NaN, limites)
  return Number.isNaN(n) ? undefined : n
}
