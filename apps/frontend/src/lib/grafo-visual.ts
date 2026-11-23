// Linguagem visual compartilhada pelos painéis de grafo (Confrontos, Zebra, Panelinhas).
// O painel é escuro nos dois temas do app; por isso estas cores não mudam com o tema.
// Contrastes e validação de daltonismo: relatórios 2026-11-17-07 e 2026-11-22-08.

export const COR_GRAFO = {
  fundo: '#0A2416',
  no: '#7FB394', // população: 6,87:1 sobre o painel
  noDestaque: '#FFD60A', // top N: 11,65:1 (a única cor cheia em repouso)
  esmaecido: '#21402D', // nós fora do foco (decorativo, abaixo de 3:1 de propósito)
  rotulo: '#ECF7F0', // 14,98:1
  rotuloContorno: 'rgba(10, 36, 22, 0.92)',
  pilula: 'rgba(17, 55, 34, 0.94)',
  pilulaBorda: 'rgba(255, 255, 255, 0.4)',
  vitoria: '#3E8FE6', // 4,92:1
  derrota: '#E2589A', // 4,77:1
  arestaRepouso: '#ECF7F0', // usada quase transparente (ver sobreFundo)
} as const

/**
 * Cores das maiores panelas (Cliques e Panelinhas). Aparecem só sobre o painel escuro
 * (nos dois temas), por isso o contraste é medido contra COR_GRAFO.fundo:
 * 11,65 · 6,60 · 7,09 · 6,38 · 9,03 (todas ≥ 4,5:1, valem também como texto).
 * Separação sob protanopia/deuteranopia/tritanopia: ΔE mínimo 20 / 18 / 10 (relatório 2026-11-23-10).
 */
export const CORES_PANELA = ['#FFD60A', '#5DA9F2', '#F59152', '#F07AB4', '#4FD1E0'] as const

/** Nó fora das maiores panelas, em repouso: recua para as panelas saltarem (3,37:1 sobre o painel). */
export const COR_NO_RECUADO = '#507A61'

export const FONTE_ROTULO = 'Public Sans Variable, system-ui, sans-serif'
export const DURACAO_FOCO_MS = 180
export const DURACAO_CAMERA_MS = 450

export const movimentoReduzido = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Curva de mola criticamente amortecida (sem quique), normalizada para terminar em 1. */
export function molaCritica(t: number) {
  const w = 9
  const f = (x: number) => 1 - (1 + w * x) * Math.exp(-w * x)
  return f(t) / f(1)
}

/** Aproximação de cubic-bezier(0.23, 1, 0.32, 1): saída rápida, chegada suave. */
export const easeOutForte = (t: number) => 1 - Math.pow(1 - t, 5)

export function hexParaRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

export function misturar(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexParaRgb(a)
  const [r2, g2, b2] = hexParaRgb(b)
  const m = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`
}

const FUNDO_RGB = hexParaRgb(COR_GRAFO.fundo)

/**
 * O programa de arestas do Sigma 3 ignora o alfa da cor; a "transparência" é
 * uma cor opaca pré-misturada com o fundo do painel.
 */
export function sobreFundo(hex: string, alfa: number) {
  const [r, g, b] = hexParaRgb(hex)
  const a = Math.min(1, Math.max(0, alfa))
  const m = (x: number, y: number) => Math.round(y + (x - y) * a)
  return `rgb(${m(r, FUNDO_RGB[0])},${m(g, FUNDO_RGB[1])},${m(b, FUNDO_RGB[2])})`
}
