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
